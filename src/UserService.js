'use strict'

var EventEmitter = require('events')
var Promise = require('bluebird')
var _ = require('lodash')

class UserService extends EventEmitter {
  constructor (fbRef) {
    super()
    this.fbRef = fbRef
    this.init()
  }
  init () {
    var self = this
    self.on('user', user => {
      console.log('user', user)
      self.user = user
    })
    self.on('auth', auth => {
      console.log('auth', auth)
      self.auth = auth
    })
    self.on('error', err => {
      console.error(err)
      throw err
    })

    // self.fbRef.onAuth(self.handleAuth.bind(self)) // FIXME: emits twice
    // self.fbRef.onAuth(self.emit.bind(self, 'auth')) // FIXME: doesn't emit user
  }

  isLoggedIn () {
    var auths = (this.user || {}).auths
    return auths && _.every(auths, auth => !auth.anonymous)
  }
  onUser () {
    var self = this
    return self.user
      ? Promise.resolve(self.user)
      : new Promise((resolve, reject) => {
          self.on('user', function handler (user) {
            if (!user) return
            self.removeListener('user', handler)
            resolve(user)
          })
        })
  }

  logOut () {
    this.fbRef.unauth()
    return this.updateUser()
  }
  updateUser () {
    return this.handleAuth(this.fbRef.getAuth())
  }
  getUserAnonymously () {
    return this.fbRef
      .authAnonymouslyAsync()
      .then(this.handleAuth.bind(this))
  }
  getUserWithPassword (creds) {
    return this.fbRef
      .authWithPasswordAsync(creds)
      .then(this.handleAuth.bind(this))
  }
  getUserWithOAuthRedirect (provider) {
    return this.fbRef
      .authWithOAuthRedirectAsync(provider)
      .then(this.handleAuth.bind(this))
  }

  handleAuth (auth) {
    return Promise.resolve(auth)
      .tap(this.emit.bind(this, 'auth'))
      .then(auth => this.constructor.getUser(auth, this.fbRef))
      .tap(this.emit.bind(this, 'user'))
      .catch(err => {
        this.emit('error', err)
        throw err
      })
  }
  static getUser (auth, fbRef) {
    return Promise.resolve(auth).then(auth => {
      auth = auth || {}
      var uid = auth.uid
      if (!uid) return null
      var uidRef = Promise.promisifyAll(fbRef.child(`uids/${uid}`))
      var usersRef = Promise.promisifyAll(fbRef.child('users'))
      return new Promise(uidRef.once.bind(uidRef, 'value'))
        .call('val')
        // .then(userKey => {
        //   if (userKey !== null) return usersRef.child(userKey)
        //   // set /uids/${uid} to a new key added to /users/
        //   var userRef
        //   return Promise
        //     .fromCallback(cb => { userRef = usersRef.push({}, cb) }) // updated later with more info
        //     .tap(() => uidRef.setAsync(userRef.key()))
        //     .return(userRef)
        // })
        // .then(Promise.promisifyAll)
        .then(userKey => {
          if (userKey !== null) return userKey
          // set /uids/${uid} to a new key added to /users/
          var userRef
          return Promise
            .fromCallback(cb => { userRef = usersRef.push({}, cb) }) // updated later with more info
            .then(() => {
              var userKey = userRef.key()
              uidRef.setAsync(userKey)
              return userKey
            })
        })
        .then(userKey => {
          var userRef = Promise.promisifyAll(usersRef.child(userKey))
          return new Promise(userRef.once.bind(userRef, 'value'))
            .call('val')
            .then(user => {
              // set /users/${userKey}/auths/${auth.uid} = auth
              user = user || {}
              if (!user.auths) user.auths = {}
              user.auths[uid] = auth
              return userRef.setAsync(user).return(user)
            })
            .tap(user => { user['.key'] = userKey })
        })
    })
  }
}

UserService.instance = new UserService(require('../config').fbRef)

module.exports = UserService
