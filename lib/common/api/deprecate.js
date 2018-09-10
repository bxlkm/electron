// Deprecate a method.
const deprecate = function (oldName, newName, fn) {
  let warned = false
  return function () {
    if (!(warned || process.noDeprecation)) {
      warned = true
      deprecate.warn(oldName, newName)
    }
    return fn.apply(this, arguments)
  }
}

// The method is aliases and the old method is retained for backwards compat
deprecate.alias = function (object, deprecatedName, existingName) {
  let warned = false
  const newMethod = function () {
    if (!(warned || process.noDeprecation)) {
      warned = true
      deprecate.warn(deprecatedName, existingName)
    }
    return this[existingName].apply(this, arguments)
  }
  if (typeof object === 'function') {
    object.prototype[deprecatedName] = newMethod
  } else {
    object[deprecatedName] = newMethod
  }
}

deprecate.warn = (oldName, newName) => {
  return deprecate.log(`'${oldName}' is deprecated. Use '${newName}' instead.`)
}

let deprecationHandler = null

// Print deprecation message.
deprecate.log = (message) => {
  if (typeof deprecationHandler === 'function') {
    deprecationHandler(message)
  } else if (process.throwDeprecation) {
    throw new Error(message)
  } else if (process.traceDeprecation) {
    return console.trace(message)
  } else {
    return console.warn(`(electron) ${message}`)
  }
}

// Deprecate an event.
deprecate.event = (emitter, oldName, newName) => {
  let warned = false
  return emitter.on(newName, function (...args) {
    // There are no listeners for this event
    if (this.listenerCount(oldName) === 0) { return }
    // noDeprecation set or if user has already been warned
    if (warned || process.noDeprecation) { return }
    warned = true
    const isInternalEvent = newName.startsWith('-')
    if (isInternalEvent) {
      // The event cannot be use anymore. Log that.
      deprecate.log(`'${oldName}' event has been deprecated.`)
    } else {
      // The event has a new name now. Warn with that.
      deprecate.warn(`'${oldName}' event`, `'${newName}' event`)
    }
    this.emit(oldName, ...args)
  })
}

deprecate.setHandler = (handler) => {
  deprecationHandler = handler
}

deprecate.getHandler = () => deprecationHandler

// Commented out until such time as it is needed
// // Forward the method to member.
// deprecate.member = (object, method, member) => {
//   let warned = false
//   object.prototype[method] = function () {
//     if (!(warned || process.noDeprecation)) {
//       warned = true
//       deprecate.warn(method, `${member}.${method}`)
//     }
//     return this[member][method].apply(this[member], arguments)
//   }
// }

// Remove a property with no replacement
deprecate.removeProperty = (object, deprecatedProperty) => {
  if (!process.noDeprecation) {
    if (!(deprecatedProperty in object)) {
      throw new Error('Cannot deprecate a property on an object which does not have that property')
    } else {
      deprecate.log(`The '${deprecatedProperty}' property has been deprecated and marked for removal.`)
    }
  }
}

// Remove a function with no replacement
deprecate.removeFunction = (deprecatedName) => {
  if (!process.noDeprecation) {
    deprecate.log(`The '${deprecatedName}' function has been deprecated and marked for removal.`)
  }
}

// Replace the old name of a property
deprecate.renameProperty = (object, deprecatedName, newName) => {
  let warned = false
  let warn = () => {
    if (!(warned || process.noDeprecation)) {
      warned = true
      deprecate.warn(deprecatedName, newName)
    }
  }

  if ((typeof object[newName] === 'undefined') &&
      (typeof object[deprecatedName] !== 'undefined')) {
    warn()
    object[newName] = object[deprecatedName]
  }

  return Object.defineProperty(object, deprecatedName, {
    get: function () {
      warn()
      return this[newName]
    },
    set: function (value) {
      warn()
      this[newName] = value
    }
  })
}

module.exports = deprecate
