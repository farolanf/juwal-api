'use strict';
const fs = require('fs')
const _ = require('lodash')
const yaml = require('yaml')

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  async resetCategories (ctx) {
    const content = fs.readFileSync('data/categories.yml')
    const categories = yaml.parse(content.toString())
    await strapi.services.category.delete({})
    _.each(categories, async (children, name) => {
      const parent = await strapi.services.category.create({ name })
      _.each(children, async childName => {
        await strapi.services.category.create({ name: childName, parent: parent._id })
      })
    })
    ctx.send('ok')
  },

  async resetProvinsi (ctx) {
    const content = fs.readFileSync('data/provinsi.yml')
    const provinsis = yaml.parse(content.toString())
    await strapi.services.provinsi.delete({})
    await strapi.services.kabupaten.delete({})
    _.each(provinsis, async (kabupatens, provinsiName) => {
      const provinsi = await strapi.services.provinsi.create({ name: provinsiName })
      _.each(kabupatens, async kabupatenName => {
        await strapi.services.kabupaten.create({ name: kabupatenName, provinsi: provinsi._id })
      })
    })
    ctx.send('ok')
  },

  async resetProductTypes (ctx) {
    const content = fs.readFileSync('data/product-types.yml')
    const productTypes = yaml.parse(content.toString())
    await strapi.services.producttype.delete({})
    await strapi.services.field.delete({})
    _.each(productTypes, async (productType, productTypeName) => {
      const category = await strapi.services.category.findOne({ name: productType.category })
      const fields = await Promise.all(productType.fields.map(async field => {
        return await strapi.services.field.create(field)
      }))
      await strapi.services.producttype.create({
        name: productTypeName,
        category: category._id,
        fields: fields.map(field => field._id)
      })
    })
    ctx.send('ok')
  }
};
