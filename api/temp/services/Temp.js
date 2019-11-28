'use strict';

const _ = require('lodash')

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  async findOrCreate(userId, defaults) {
    let doc = await strapi.services.temp.findOne({ owner: userId })
    if (!doc) {
      const data = Object.assign({ owner: userId }, defaults)
      doc = await strapi.services.temp.create(data)
    }
    return _.defaults(doc, defaults)
  }
};
