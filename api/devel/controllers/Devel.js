'use strict';
const fs = require('fs')
const _ = require('lodash')
const yaml = require('yaml')

const { createIndex } = require('../../../libs/elasticsearch')

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  async initES (ctx) {
    await createIndex()
    ctx.send('ok')
  },
  async resetCategories (ctx) {
    const content = fs.readFileSync('data/categories.yml')
    const categories = yaml.parse(content.toString())
    await strapi.services.category.deleteTree({ name: 'Products' })
    const root = await strapi.services.category.create({ name: 'Products' })
    let order = 0
    _.each(categories, async (children, name) => {
      order += 1000;
      (async function(order){
        const parent = await strapi.services.category.create({ name, parent: root.id, order })
        _.each(children, childName => {
          order += 10
          strapi.services.category.create({ name: childName, parent: parent.id, order })
        })
      }(order))
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
        await strapi.services.kabupaten.create({ name: kabupatenName, provinsi: provinsi.id })
      })
    })
    ctx.send('ok')
  },

  async resetProductTypes (ctx) {
    const content = fs.readFileSync('data/product-types.yml')
    const productTypes = yaml.parse(content.toString())
    await strapi.services.producttype.delete({})
    await strapi.services.field.delete({})
    let order = 0
    _.each(productTypes, async (productType, productTypeName) => {
      order += 100;
      (async function(order) {
        const productTypeOrder = order
        const category = await strapi.services.category.findOne({ name: productType.category })
        const fields = await Promise.all(productType.fields.map(async field => {
          order += 4
          return strapi.services.field.create({
            label: field.label,
            producttype: productTypeName,
            options: {
              value: field.options
            },
            order
          })
        }))
        await strapi.services.producttype.create({
          name: productTypeName,
          category: category.id,
          fields: fields.map(field => field.id),
          order: productTypeOrder
        })
      }(order))
    })
    ctx.send('ok')
  }
};
