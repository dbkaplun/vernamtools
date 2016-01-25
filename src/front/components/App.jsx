import React from 'react'
import _ from 'lodash'

import Navbar from './Navbar.jsx'
import contextTypes from './contextTypes'

export default React.createClass({
  childContextTypes: _.pick(contextTypes, 'app'),
  getChildContext () { return {app: this} },
  getInitialState () {
    return {
      alerts: [],
      maxVisibleAlertCount: 5
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
          {!window.location.hostname.match(/github\.io$/) ? '' : (
            <p className="help-block">
              NOTE: this is a static demo and as such the data won't update and you can't kill processes.
              Please see <a href="https://github.com/dbkaplun/webtop" target="_blank">the project page</a> for install instructions!
            </p>
          )}
          {this.props.children}
        </main>
      </div>
    )
  }
})
