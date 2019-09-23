var handler = require('./src/handler')
var allowsCookies = require('./src/allows-cookies')
var hasOptedOut = require('./src/user-optout')

var SKIP_TOKEN = '__SKIP_TOKEN__'

window.addEventListener('message', function (event) {
  var message = event.data
  var origin = event.origin
  var ports = event.ports

  function withSameOrigin (handler) {
    return function () {
      if (origin !== window.location.origin) {
        console.warn('Incoming message had untrusted origin "' + origin + '", will not process.')
        return SKIP_TOKEN
      }
      return handler.apply(null, [].slice.call(arguments))
    }
  }

  var match = function () {
    return Promise.reject(
      new Error(
        'Received message of unknown type "' + message.type + '", skipping.'
      )
    )
  }

  switch (message.type) {
    case 'EVENT': {
      if (hasOptedOut()) {
        match = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('You have opted out of data collection, no data is being collected.')
          console.log('Find out more about offen at "https://www.offen.dev".')
          return Promise.resolve()
        }
      } else if (!allowsCookies()) {
        match = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('Your setup prevents or you have disabled third party cookies in your browser\'s settings.')
          console.log('Basic usage data will be collected anonymously.')
          console.log('Find out more at "https://www.offen.dev".')
          return handler.handleAnonymousEvent.apply(null, [].slice.call(arguments))
        }
      } else {
        match = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('You can access and manage all of your personal data or opt-out at "' + window.location.origin + '/auditorium/".')
          console.log('Find out more about offen at "https://www.offen.dev".')
          return handler.handleAnalyticsEvent.apply(null, [].slice.call(arguments))
        }
      }
      break
    }
    case 'QUERY':
      match = withSameOrigin(handler.handleQuery)
      break
    case 'PURGE':
      match = withSameOrigin(handler.handlePurge)
      break
    case 'OPTOUT':
      match = withSameOrigin(handler.handleOptout)
      break
    case 'OPTOUT_STATUS':
      match = withSameOrigin(handler.handleOptoutStatus)
      break
    case 'LOGIN':
      match = withSameOrigin(handler.handleLogin)
      break
    case 'CHANGE_CREDENTIALS':
      match = withSameOrigin(handler.handleChangeCredentials)
      break
    case 'FORGOT_PASSWORD':
      match = withSameOrigin(handler.handleForgotPassword)
      break
    case 'RESET_PASSWORD':
      match = withSameOrigin(handler.handleResetPassword)
      break
  }

  function respond (message) {
    if (ports && ports.length && message !== SKIP_TOKEN) {
      ports[0].postMessage(message)
    }
  }

  Promise.resolve(match(message))
    .then(respond, function (err) {
      // this is not in a catch block on purpose as
      // it tries to prevent a situation where calling
      // `respond` throws an error, which would in turn
      // call it again, throwing another error
      if (process.env.NODE_ENV !== 'production') {
        console.error(err)
      }
      respond({
        type: 'ERROR',
        payload: {
          error: err.message,
          stack: err.stack
        }
      })
    })
    .catch(function (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error responding to incoming message.')
        console.error(err)
      }
    })
})
