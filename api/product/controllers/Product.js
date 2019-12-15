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
      if (_.includes(paramNames, 'owner')) {
        // restrict find by owner only to the owner
        if (!ctx.state.user || ctx.query.owner !== ctx.state.user.id) {
          return ctx.badRequest()
        }
      }
      entities = await strapi.services.product.find(ctx.query);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.product }));
  },

  async create(ctx) {
    const userTemp = await strapi.services.temp.findOrCreate(ctx.state.user.id, {     
      productImages: [] 
    })
    const body = Object.assign({}, ctx.request.body, {
      owner: ctx.state.user.id,
      images: userTemp.productImages
    })
    let entity = await strapi.services.product.create(body);

    if (ctx.request.body.specfields) {
      entity.fields = await Promise.all(ctx.request.body.specfields.map(sf => {
        return strapi.services.fieldvalue.create({
          field: sf.id,
          value: { value: sf.value }
        })
      }))
    }
    await strapi.services.product.update({ id: entity.id }, entity)

    entity = await strapi.services.product.findOne({ id: entity.id }, {
      path: 'fields',
      populate: 'field'
    })
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
