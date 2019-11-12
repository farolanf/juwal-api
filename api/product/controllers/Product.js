'use strict';

const _ = require('lodash')
const { parseMultipartData, sanitizeEntity } = require('strapi-utils')

module.exports = {
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      if (_.castArray(files.images).length > strapi.config.maxProductImages) {
        return ctx.badRequest()
      }
      entity = await strapi.services.product.create(data, { files });
    } else {
      entity = await strapi.services.product.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.product });
  }
}
