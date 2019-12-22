const _ = require('lodash')
const { Client } = require('@elastic/elasticsearch')

const esHost = 'http://localhost:9200'

const client = new Client({ node: esHost })

exports.indexProduct = product => {
  return client.index({
    index: 'products',
    body: {
      ..._.pick(product, ['id', 'title', 'description', 'price']),
      attrs: product.fields.map(fv => ({
        label: fv.field.label,
        value: fv.value.value
      }))
    }
  })
}

exports.searchProducts = ({ query, attrs }) => {
  return client.search({
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