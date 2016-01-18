const arrayToObjectKeys = require('./arrayToObjectKeys')

module.exports = arrayToObjectKeys('%CPU %MEM PID PPID'.split(/\s+/), true)
