const _ = require('lodash')

module.exports = function arrayToObjectKeys (arr, val) {
  if (typeof val !== 'function') val = _.constant(val)
  return _(arr).object().mapValues(val).value()
}
