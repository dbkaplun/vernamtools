import React from 'react'
import { Router, Route } from 'react-router'

import Firebase from 'firebase'
import Promise from 'bluebird'

import Navbar from './Navbar.jsx'
import PostList from './PostList.jsx'
import PostCreate from './PostCreate.jsx'
import PostDetail from './PostDetail.jsx'

export default React.createClass({
  getInitialState () {
    return {
      user: null,
      alerts: []
    }
  },
  componentWillMount () {
    this.fbRef = Promise.promisifyAll(new Firebase('https://dbtag.firebaseio.com'))
  },
  componentDidMount () {
    var self = this
    self.fbRef.onAuth(user => {
      self.handleAuth(user)
        .catch(err => { console.error(err) })
        .done()
    })
    self.updateAuth().then(user => {
    // if (!user) return self.self.handleAuth(self.fbRef.authAnonymouslyAsync()) // FIXME: overrides logged in user
    })
      .catch(err => { console.error(err) })
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

  handleAuth (user) {
    var self = this
    return Promise.resolve(user)
      .catch(err => {
        self.alertFromError(err)
        throw err
      })
      .then(user => {
        console.log('user', user)
        self.setState({user})
        return user
      })
  },
  updateAuth () {
    return this.handleAuth(this.fbRef.getAuth())
  },
  authWithOAuthRedirect (provider) {
    return this.handleAuth(this.fbRef.authWithOAuthRedirectAsync(provider))
  },
  authWithPassword (creds) {
    return this.handleAuth(this.fbRef.authWithPasswordAsync(creds))
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
          </Router>
        </main>
      </div>
    )
  }
})
