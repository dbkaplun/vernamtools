var Promise = require('bluebird')
var Firebase = require('firebase')
var _ = require('lodash')
var moment = require('moment')

try {
  var local = require('./local')
} catch (e) {
  var local = {}
}

var config = _.merge({
  fbUrl: 'https://dbtag.firebaseio.com',
  postMonitor: {
    olderThan: moment.duration(5, 'minutes')
  }
}, local)
config.fbRef = Promise.promisifyAll(new Firebase(config.fbUrl))

module.exports = config
