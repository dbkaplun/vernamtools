import React from 'react'
import { Router, Route } from 'react-router'

import Promise from 'bluebird'
window.jQuery = require('jquery')

import Navbar from './Navbar.jsx'
import PostList from './PostList.jsx'
import PostCreate from './PostCreate.jsx'
import PostDetail from './PostDetail.jsx'

import config from '../../config'
import UserService from '../../util/UserService'

export default React.createClass({
  getInitialState () {
    return {
      user: null,
      alerts: []
    }
  },
  componentWillMount () {
    var self = this
    self.fbRef = config.fbRef
    self.u = UserService.instance
    self.u.on('user', user => { self.forceUpdate() })
    self.u.on('error', err => { self.alertFromError(err) })
    self.u.updateUser()
      .then(user => user || self.u.getUserAnonymously())
      .done()
  },

  alertFromError (err) {
    var alerts = this.state.alerts
    var alert = {
      className: err.className || 'alert-warning',
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

  createElement (Component, props) {
    props.dbtag = this
    return <Component {...props} />
  },
  render () {
    return (
      <div>
        <Navbar dbtag={this} />
        <main className="container">
          <div>
            {this.state.alerts.map((alert, alertIndex) => (
              <div className={`alert ${alert.className || 'alert-danger'}`} role="alert" key={alertIndex}>
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
          <Router createElement={this.createElement}>
            <Route path="/" component={PostList} />
            <Route path="/posts/create" component={PostCreate} />
            <Route path="/posts/:postKey" component={PostDetail} />
            <Route path="/users/:userKey" component={null} />
          </Router>
        </main>
      </div>
    )
  }
})
