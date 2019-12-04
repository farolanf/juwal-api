'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.category.search(ctx.query);
    } else {
      entities = await strapi.services.category.find(ctx.query, {
        path: 'categories',
        populate: [
          {
            path: 'categories',
            populate: {
              path: 'producttypes',
              populate: 'fields'
            }
          },
          {
            path: 'producttypes',
            populate: 'fields'
          }
        ]
      });
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.category }));
  }
};
