const _ = require('lodash')
const moment = require('moment')

try {
  var local = require('./local')
} catch (e) {
  var local = {}
}

var config = _.merge({
  hostname: process.env.HOSTNAME || 'localhost',
  port: parseInt(process.env.PORT, 10) || 3370,

  snapshotInterval: moment.duration(1, 'seconds'),
  maxBuffer: 1000*1024 // increase if you are getting "stdout maxBuffer exceeded." errors
}, local)

module.exports = config
