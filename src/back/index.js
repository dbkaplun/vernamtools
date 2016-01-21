#!/usr/bin/env node

const gulp = require('gulp')
require('../../gulpfile')
if (require.main === module) gulp.start('default')
else module.exports = require('./WebtopServer')
