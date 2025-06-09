/**
 * Global middlewares index file
 * Exports all custom global middlewares
 */

'use strict';

module.exports = {
  'badges-redirect': {
    enabled: true,
    resolve: require('./badges-redirect')
  },
  'request-logger': {
    enabled: true,
    resolve: require('./request-logger')
  },
}; 