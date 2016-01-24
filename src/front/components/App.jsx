import React from 'react'
import {Router, Route, Redirect} from 'react-router'

import Promise from 'bluebird'
import createHashHistory from 'history/lib/createHashHistory'

import Navbar from './Navbar.jsx'
import ProcessList from './ProcessList.jsx'
import Settings from './Settings.jsx'

import contextTypes from './contextTypes'

export default React.createClass({
  childContextTypes: contextTypes,
  getInitialState () {
    return {
      alerts: [],
      maxVisibleAlertCount: 5
    }
  },
  componentWillMount () {
    var self = this
    self.history = createHashHistory()
  },
  getChildContext () {
    return {
      app: this,
      history: this.history
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
    var state = this.state
    var alerts = state.alerts
    var invisibleAlerts = Math.max(0, alerts.length - state.maxVisibleAlertCount)
    return (
      <div>
        <Navbar />
        <main className="container">
          <div>
            {alerts.slice(0, state.maxVisibleAlertCount).map((alert, alertIndex) => (
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
            <p className={`text-muted ${invisibleAlerts ? '' : 'hide'}`}>
              {invisibleAlerts} alert{invisibleAlerts === 1 ? '' : 's'} not shown
            </p>
          </div>
          <Router history={this.history}>
            <Redirect from="/" to="/ps" />
            <Route path="/ps" component={ProcessList} />
            <Route path="/settings" component={Settings} />
          </Router>
        </main>
      </div>
    )
  }
})
