'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/services.html#core-services)
 * to customize this service
 */

module.exports = {
  async deleteTree(params) {
    const docs = await strapi.services.category.find(params)
    const ids = docs.map(doc => doc.id)
    if (ids.length) {
      await this.deleteTree({ parent_in: ids })
      await strapi.services.category.delete({ _id_in: ids })
    }
  }
};
