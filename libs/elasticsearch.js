const _ = require('lodash')
const { Client } = require('@elastic/elasticsearch')

let client

const getClient = () => {
  if (!client) {
    const esHost = strapi.config.environments[strapi.config.environment].esHost
    client = new Client({ node: esHost })
  }
  return client
}

exports.createIndex = () => {
  return getClient().indices.create({
    index: 'products',
    body: {
      mappings: {
        properties: {
          id: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          title: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          description: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          },
          price: { type: 'long' },
          attrs: {
            type: 'nested',
            properties: {
              label: {
                type: 'keyword'
              },
              value: {
                type: 'keyword'
              }
            }
          }
        }
      }
    }
  })
}

exports.indexProduct = product => {
  const envConfig = strapi.config.environments[strapi.config.environment]
  return getClient().index({
    index: 'products',
    id: product.id,
    // update if exists and create if not
    op_type: 'index',
    body: {
      ..._.pick(product, ['id', 'title', 'description', 'price']),
      attrs: product.fields.map(fv => ({
        label: fv.field.label,
        value: fv.value.value
      })),
      images: product.images.filter(item => item).map(item => {
        return item.url[0] === '/' ? `${envConfig.apiUrl}${item.url}` : item.url
      })
    }
  })
}

exports.searchProducts = ({ query, attrs }) => {
  return getClient().search({
    index: 'products',
    body: {
      query: {
        bool: {
          must: [
            ...(query
              ? [{
                simple_query_string: {
                  query,
                  fields: ['title^10', 'description']
                }
              }] : []
            ),
            ...(attrs && attrs.length > 0
              ? [{
                bool: {
                  must: attrs.map(attr => ({
                    nested: {
                      path: 'attrs',
                      query: {
                        bool: {
                          must: [
                            { match: { 'attrs.label': attr.label } },
                            { match: { 'attrs.value': attr.value } }
                          ]
                        }
                      }
                    }
                  }))
                }
              }] : []
            )
          ]
        }
      },
      aggs: {
        attrs: {
          nested: {
            path: 'attrs'
          },
          aggs: {
            attrs: {
              terms: {
                field: 'attrs.label'
              },
              aggs: {
                values: {
                  terms: {
                    field: 'attrs.value'
                  }
                }
              }
            }
          }
        }
      }
    }
  }).then(res => res.body)
}