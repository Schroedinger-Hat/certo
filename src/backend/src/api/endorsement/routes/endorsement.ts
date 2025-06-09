/**
 * endorsement router
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreRouter('api::endorsement.endorsement', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
}) 