import React from 'react'
import { Router, Route } from 'react-router'

import Promise from 'bluebird'
import Firebase from 'firebase'
import createHashHistory from 'history/lib/createHashHistory'
window.jQuery = require('jquery')

import Navbar from './Navbar.jsx'
import PostList from './PostList.jsx'
import PostCreate from './PostCreate.jsx'
import PostDetail from './PostDetail.jsx'
import Settings from './Settings.jsx'

import contextTypes from './contextTypes'
import config from '../../../config'
import UserService from '../../UserService'

export default React.createClass({
  childContextTypes: contextTypes,
  getInitialState () {
    return {alerts: []}
  },
  componentWillMount () {
    var self = this
    self.history = createHashHistory()
    self.fbRef = config.fbRef
    self.u = UserService.instance
    self.u.on('user', user => { self.forceUpdate() })
    self.u.on('error', err => { self.alertFromError(err) })
    self.u.updateUser()
      // .then(user => user || self.u.getUserAnonymously())
      .catch(self.alertFromError)
      .done()
  },
  getChildContext () {
    return {
      app: this,
      fbRef: this.fbRef,
      history: this.history,
      u: this.u
    }
  },

  alertFromError (err) {
    console.error(err)
    var alerts = this.state.alerts
    var alert = {
      className: err.className || 'alert-danger',
      children: err.contents || (
        <span>{err.message}</span>
      ),
      err: err
    }
    alerts.push(alert)
    this.setState({alerts})
    return alert
  },
  closeAlert (alertIndex, evt) {
    var alerts = this.state.alerts
    var closedAlert = alerts.splice(alertIndex, 1)[0]
    this.setState({alerts})
  },

  render () {
    return (
      <div>
        <Navbar />
        <main className="container">
          <div>
            {this.state.alerts.map((alert, alertIndex) => (
              <div className={`alert ${alert.className}`} role="alert" key={alertIndex}>
                <button
                  className="close"
                  aria-label="Close"
                  onClick={this.closeAlert.bind(this, alertIndex)}>
                  <span aria-hidden="true">&times;</span>
                </button>
                {alert.children}
              </div>
            ))}
          </div>
          <Router history={this.history}>
            <Route path="/" component={PostList} />
            <Route path="/settings" component={Settings} />
            <Route path="/posts/create" component={PostCreate} />
            <Route path="/posts/:postKey" component={PostDetail} />
            <Route path="/users/:userKey" component={null} />
          </Router>
        </main>
      </div>
    )
  }
})
