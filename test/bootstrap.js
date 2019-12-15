const chai = require('chai')
const chaiHttp = require('chai-http')
const strapi = require('strapi')()

chai.use(chaiHttp)

global.expect = chai.expect
global.assert = chai.assert
global.request = chai.request

global.strapi = strapi
global.apiUrl = 'http://192.168.1.4:1337'

// global.initStrapi = (before, after) => {
//   before(done => {
//     strapi.start(done)
//   })
//   after(() => {
//     strapi.stop()
//   })
// }