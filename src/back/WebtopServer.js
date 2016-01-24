#!/usr/bin/env node

'use strict'

const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const errorHandler = require('errorhandler')
const Promise = require('bluebird')
const _ = require('lodash')
const opn = require('opn')

const execAsync = Promise.promisify(require('child_process').exec)
const parseColumns = require('parse-columns')

const numericPsCols = require('../numericPsCols')
const arrayToObjectKeys = require('../arrayToObjectKeys')

class WebtopServer {
  constructor (opts) {
    this.opts = opts
    this.initApp()
  }

  initApp () {
    var app = this.app = express()

    app.get('/api/ps', (req, res) => {
      this.ps().then(ps => { res.json(ps) }).done()
    })
    app.post('/api/kill/:ps', (req, res) => {
      if (!this.opts.debug) req.params.ps
        .split(/\s*,\s*/)
        .forEach(pid => { process.kill(pid, req.query.signal) })
      res.json(true)
    })
    app.use(express.static(path.resolve(__dirname, '..', '..', 'dist')))

    app.use(methodOverride())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
      extended: true
    }))
    app.use(errorHandler({
      dumpExceptions: true,
      showStack: true
    }))
  }

  listen () {
    var listener
    return new Promise(resolve => (
      listener = this.app.listen(this.opts.port, this.opts.hostname, resolve)
    )).then(() => listener)
  }

  main () {
    this.listen()
      .then(listener => listener.address())
      .then(bound => `http://${bound.address}:${bound.port}`)
      .tap(address => {
        console.error(`WebtopServer started: ${address}`)
        if (this.opts.open) {
          console.error("(opts.open = true, opening)")
          opn(address)
        }
      })
      .done()
  }

  ps () {
    var colsObj = _(this.opts.psColumns).object().set('pid', true).value()
    if (this.opts.debug) delete colsObj.args // environment variables are insecure
    var psCalls = []
    if ('args' in colsObj && 'comm' in colsObj) {
      psCalls.push(['pid', 'args'])
      delete colsObj.args
    }
    psCalls.push(_.keys(colsObj))
    return Promise
      .all(psCalls.map(args => this._ps(args)))
      .then(ress => _(ress)
        .flatten()
        .groupBy('PID')
        .mapValues(pidGroup => _.merge.apply(null, [{}].concat(pidGroup)))
        .values()
        .value())
  }

  _ps (args) {
    return execAsync(`ps -Eeo ${args.join(',')}`, {maxBuffer: this.opts.maxBuffer})
      .then(stdout => parseColumns(stdout, {transform: (el, header) => {
        if (numericPsCols[header]) el = Number(el)
        return el
      }}))
  }
}

module.exports = WebtopServer

if (require.main === module) new WebtopServer(require('../../config')).main()
