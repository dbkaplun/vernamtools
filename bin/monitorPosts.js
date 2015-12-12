#!/usr/bin/env node

"use strict"

var cheerio = require('cheerio')
var _ = require('lodash')
var moment = require('moment')
var rp = require('request-promise')
var Firebase = require('firebase')
var Promise = require('bluebird')

class PostMonitor {
  constructor (config) {
    var self = this
    self.config = config
    self.fbRef = config.fbRef
    self.posts = self.fbRef.child('posts')
    self.tags = self.fbRef.child('tags')
    self.auth()
      .then(() => {
        ['child_added', 'child_changed'].forEach(evt => {
          self.posts.on(evt, snapshot => {
            self.updatePost(snapshot)
              .tap(post => { console.log(moment().toString(), post) })
              .catch(console.error)
              .done()
          })
        })
      })
      .catch(err => {
        console.error(err)
        Firebase.goOffline()
      })
      .done()
  }
  auth () {
    var self = this
    if (self.user) return Promise.resolve(self.user)
    return self.fbRef.createUserAsync(self.config.monitorPosts.credentials)
      .catch(err => { if (err.code !== 'EMAIL_TAKEN') throw err })
      .then(() => { return self.fbRef.authWithPasswordAsync(self.config.monitorPosts.credentials) })
      .tap(user => { self.user = user })
  }
  updatePost (snapshot) {
    var self = this
    var post = snapshot.val()
    if (post.updatedDate && moment(post.updatedDate).isAfter(moment().subtract(self.config.monitorPosts.olderThan))) return Promise.resolve(post)
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
            users[self.user.uid] = now
            ps.push(Promise.promisifyAll(postTags.child(keyword)).updateAsync(users))
          }
          return ps
        })))
      })
      .return(post)
  }
}

module.exports = PostMonitor

if (require.main === module) new PostMonitor(require('../config'))
