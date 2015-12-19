import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import Promise from 'bluebird'
import Firebase from 'firebase'
import _ from 'lodash'

import contextTypes from './contextTypes'
import validateFirebaseKey from '../../validateFirebaseKey'

export default React.createClass({
  mixins: [ReactFireMixin],
  contextTypes: contextTypes,
  getInitialState () {
    return {
      user: {
        nick: ''
      }
    }
  },
  componentDidMount () {
    var self = this
    var context = self.context
    context.u.onUser().then(user => {
      self.userRef = Promise.promisifyAll(self.context.fbRef.child(`users/${(user || {})['.key']}`))
      if (self._userBound) self.unbind('user')
      self.bindAsObject(self.userRef, 'user')
      // self.state.user = user
      self._userBound = true
    })
  },
  handleUserFormChange (evt) {
    evt.preventDefault()
    var user = this.state.user
    user[evt.target.name] = evt.target.value
    this.setState({user})
  },
  handleUserFormSubmit (evt) {
    evt.preventDefault()
    var self = this
    var context = self.context
    var u = context.u
    var user = self.state.user
    user.updatedDate = Date.now()
    var nickRef = Promise.promisifyAll(context.fbRef.child(`nicks/${user.nick}`))
    new Promise(nickRef.once.bind(nickRef, 'value'))
      .call('val')
      .then(userKey => {
        var userFormKey = user['.key']
        if (userKey) {
          if (userKey === userFormKey) return // user already owns the nick
          else throw new Error("nick taken")
        }
        var oldNick = (u.user || {}).nick
        return nickRef.setAsync(userFormKey)
          .then(() => { if (oldNick && oldNick !== user.nick) return Promise.promisifyAll(context.fbRef.child(`nicks/${oldNick}`)).remove() })
          .then(() => self.userRef.updateAsync(_.pick(user, (val, key) => validateFirebaseKey(key))))
          .then(() => u.updateUser())
      })
      .catch(context.app.alertFromError)
      .done()
  },
  render () {
    var state = this.state
    var user = state.user
    var u = this.context.u
    return (
      <div>
        <div className="page-header">
          <h2>
            Settings
            <span className="pull-right">
              <Link to="/" className="btn btn-primary">Home &raquo;</Link>
            </span>
          </h2>
        </div>
        {u.isLoggedIn()
          ? (
            <form onSubmit={this.handleUserFormSubmit} className="form-horizontal">
              <div className="form-group">
                <label htmlFor="settings-form-nick">Nickname <small className="text-muted">(optional)</small></label>
                <input className="form-control" onChange={this.handleUserFormChange} name="nick" value={user.nick} id="settings-form-nick" />
              </div>
              <button className="btn btn-primary">Save</button>
            </form>
          )
          : (
            <p>You must login before you can change settings.</p>
          )
        }
      </div>
    )
  }
})
