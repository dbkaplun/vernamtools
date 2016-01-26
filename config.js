const rc = require('rc')

const pkg = require('./package')

module.exports = rc(pkg.name, {
  open: true,
  hostname: process.env.HOSTNAME || 'localhost',
  port: parseInt(process.env.PORT, 10) || 3370,
  psColumns: ['pid', 'ppid', 'pcpu', 'pmem', 'user', 'args', 'comm'],
  maxBuffer: 10000*1024 // increase if you are getting "stdout maxBuffer exceeded." errors
})
