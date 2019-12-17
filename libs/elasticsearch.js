const _ = require('lodash')
const { Client } = require('@elastic/elasticsearch')

const esHost = 'http://localhost:9200'

const client = new Client({ node: esHost })

exports.indexProduct = product => {
  return client.index({
    index: 'products',
    body: {
      ..._.pick(product, ['id', 'title', 'description', 'price'])
    }
  })
}

exports.searchProducts = ({ query }) => {
  return client.search({
    index: 'products',
    body: {
      query: {
        match: {
          title: query
        }
      }
    }
  }).then(res => res.body)
}