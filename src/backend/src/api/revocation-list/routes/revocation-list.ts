/**
 * revocation-list router
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreRouter('api::revocation-list.revocation-list', {
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