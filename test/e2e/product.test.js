const { bearerToken } = require('../helpers')

describe('product', function () {

  it('create product', function () {
    return request(apiUrl)
      .post('/products')
      .set('authorization', bearerToken)
      .send({
        category: '5de0f19503b4b06fb2a54299',
        producttype: '5de0c7b05b030b5ea55b095a',
        specfields: [
          { id: '5de0c7b05b030b5ea55b0956', value: 'Suzuki' },
          { id: '5de0c7b05b030b5ea55b0957', value: 'Silver' },
        ],
        title: 'product title',
        description: 'product desc',
        price: 0,
        kabupaten: '5de0c7ab5b030b5ea55b0955'
      })
      .then(res => {
        expect(res).to.have.status(200)
        expect(res.body.title).to.equal('product title')
        expect(res.body.fields).to.have.length(2)
        expect(res.body.fields[0]).to.have.nested.property('field.id', '5de0c7b05b030b5ea55b0956')
        expect(res.body.fields[0]).to.have.nested.property('value.value', 'Suzuki')
        expect(res.body.fields[1]).to.have.nested.property('field.id', '5de0c7b05b030b5ea55b0957')
        expect(res.body.fields[1]).to.have.nested.property('value.value', 'Silver')
      })
  })
})