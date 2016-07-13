/**
 * project-javascript.js
 * https://github.com/andyyoung/optimizely-utils
 *
 * @version   0.1, 12th July 2016
 *
 * @author    Andy Young  https://twitter.com/@andyy
 * @licence   MIT
 *
 * Place this code into Optimizely's Experiment Javascript field (for a single experiment)
 * or Project Javascript field (to have it accessible across every experiment in your project)
 * and observe an immediate reduction in the number of times you wish to poke yourself in the eye.
 */

window.optimizelyUtils = window.optimizelyUtils || {};

/**
 * Wrap your variation javascript code within a call to this function
 * to circumvent Optimizely's silent dropping of errors that will otherwise drive you nuts.
 *
 * e.g. window.optimizelyUtils.wrapCode(function() { $('element').html('..your changes here..'); });
 */
window.optimizelyUtils.wrapCode = function(f) {
  try {
    // initialise window.sitehound - Optimizely (probably) executes before Google Tag Manager
    window.analytics = window.analytics || [];
  	
    // do whatever we really wanted to do
    f();

  } catch (e) {
    // catch + report on JS errors
    window.optimizelyUtils.error(e.name + '; ' + e.message);
    window.analytics.push([
      'track',
      'Optimizely JS Error',
      {name: e.name, message: e.message}
    ]);
  }
}

/**
 * Wrap your custom Conditional Activation Mode functions within a call to this function
 * to circumvent Optimizely's silent dropping of errors that will otherwise drive you nuts.
 *
 * e.g. window.optimizelyUtils.wrapActivationFunction(function(activate, options) { ... });
 */
window.optimizelyUtils.wrapActivationFunction = function(f) {
  return function(activate, options) {
    window.optimizelyUtils.wrapCode(function() {
      f(activate, options);
    });
  };
}

/**
 * Wait to execute a given function until we have a given condition:
 * - global variable is set (ie. `window[key]`)
 * - key of an object is set
 * - function returns true
 *
 * param     key string|function
 * param       f function
 * param  object object (optional - defaults to window) 
 */
window.optimizelyUtils.waitFor = function(key, f, object) {
  var o = object || window;
  if (typeof key === 'function') {
    // key is a function - execute f() as soon as it returns true
    if (key()) {
      f();
    } else {
      setTimeout(function() { window.optimizelyUtils.waitFor(key, f, object); }, 100);
    }
  } else {
    // key is a string key of (object || window)
    // handle nested object references:
    var keys = key.split('.');
    for (var i = 0; i < keys.length; i++) {
      if (typeof o[keys[i]] === 'undefined') {
        // not available yet
        setTimeout(function() { window.optimizelyUtils.waitFor(key, f, object); }, 50);
        return;
      }
      // else - object.key is now available
      o = o[keys[i]];
    }
    // execute f()
    f();
  }
}

/**
 * helper for error logging to console
 */
window.optimizelyUtils.error = function(msg) {
  if (!window.console) {
    return;
  }
  if (console.error) {
    console.error(msg);
  } else if (console.log) {
    console.log('[ERROR] ' + msg);
  }
}
