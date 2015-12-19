#!/usr/bin/env node

'use strict'

var cheerio = require('cheerio')
var moment = require('moment')
var rp = require('request-promise')
var Firebase = require('firebase')
var Promise = require('bluebird')

var UserService = require('../UserService')

class PostMonitor {
  constructor (config) {
    this.config = config
    this.fbRef = config.fbRef
    this.posts = this.fbRef.child('posts')
    this.tags = this.fbRef.child('tags')
    this.u = UserService.instance
  }
  watch () {
    var self = this
    var handleError = err => { console.error(err) }

    self.makeUser().catch(handleError).done()
    self.u.on('user', user => { if (!user) self.makeUser().catch(handleError).done() })

    ;['child_added', 'child_changed'].forEach(evt => {
      self.posts.on(evt, snapshot => {
        self.u.onUser()
          .then(() => self.updatePost(snapshot))
          .tap(post => { console.log(evt, moment().toString(), post) })
          .catch(handleError)
          .done()
      })
    })
  }
  makeUser () {
    var self = this
    return self.u.user
      ? Promise.resolve(self.u.user)
      : self.fbRef.createUserAsync(self.config.postMonitor.credentials)
          .catch(err => { if (err.code !== 'EMAIL_TAKEN') throw err })
          .then(() => self.u.getUserWithPassword(self.config.postMonitor.credentials))
  }
  updatePost (snapshot) {
    var self = this
    if (!self.u.isLoggedIn()) throw new Error("login first")
    var post = snapshot.val()
    if (post.updatedDate && moment(post.updatedDate).isAfter(moment().subtract(self.config.postMonitor.olderThan))) return Promise.resolve(post)
    var path = snapshot.toString()
    var postTags = self.tags.child(encodeURIComponent(path))
    return rp(post.url)
      .then(cheerio.load)
      .then($ => {
        var now = Date.now()
        post.title = $('title').text()
        post.description = $('meta[name="description"]').attr('content') || ''
        post.updatedDate = now
        var keywords = ($('meta[name="keywords"]').attr('content') || '').split(/\s*,\s*/)
        return Promise.all([
          Promise.promisifyAll(snapshot.ref()).setAsync(post)
        ].concat(keywords.reduce((ps, keyword) => {
          if (keyword) {
            var users = {}
            users[self.u.user['.key']] = now
            ps.push(Promise.promisifyAll(postTags.child(keyword)).updateAsync(users))
          }
          return ps
        })))
      })
      .return(post)
  }
}

module.exports = PostMonitor

if (require.main === module) new PostMonitor(require('../../config')).watch()
