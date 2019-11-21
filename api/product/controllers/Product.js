'use strict';

const _ = require('lodash')
const { parseMultipartData, sanitizeEntity } = require('strapi-utils')
const { uploadFiles } = require('../../../libs/upload')

module.exports = {
  async uploadImage(ctx) {
    ctx.send(await uploadFiles(ctx, {
      modelName: 'product',
      tempFieldName: 'productImages',
      fieldName: 'images',
      numMaxUploads: strapi.config.maxProductImages
    }))
  },

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.product.search(ctx.query);
    } else {
      const paramNames = _.keys(ctx.query)
      if (_.find(paramNames, name => _.startsWith(name, 'owner_'))) {
        return ctx.badRequest()
      }
      if (_.find(paramNames, 'owner')) {
        // restrict find by owner only to the owner
        if (!ctx.state.user || ctx.query.owner !== ctx.state.user._id) {
          return ctx.badRequest()
        }
      }
      entities = await strapi.services.product.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.product }));
  },

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
  },

  async update(ctx) {
    let entity = await strapi.services.product.findOne(ctx.params);
    if (entity.owner.id !== ctx.state.user.id) {
      return ctx.unauthorized()
    }
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.product.update(ctx.params, data, { files });
    } else {
      entity = await strapi.services.product.update(ctx.params, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.product });
  },
}
