import React from 'react'
import { Link } from 'react-router'

import contextTypes from './contextTypes'

export default React.createClass({
  contextTypes: contextTypes,
  getInitialState () {
    return {
      emailForm: {
        email: '',
        password: ''
      }
    }
  },
  handleRegister (evt) {
    evt.preventDefault()
    var self = this
    var context = self.context
    context.fbRef.createUserAsync(this.state.emailForm)
      .then(this.getUserWithEmailForm)
      .catch(context.app.alertFromError)
      .done()
  },
  getUserWithEmailForm () {
    return this.context.u.getUserWithPassword(this.state.emailForm)
  },
  handleLogin (evt) {
    evt.preventDefault()
    this.getUserWithEmailForm().catch(this.context.app.alertFromError).done()
  },
  handleLogout (evt) {
    evt.preventDefault()
    this.context.u.logOut()
  },
  handleEmailFormChange (evt) {
    evt.preventDefault()
    var emailForm = this.state.emailForm
    emailForm[evt.target.name] = evt.target.value
    this.setState({emailForm})
  },
  oAuthHandler (provider) {
    throw new Error("not implemented")
    var self = this
    var context = self.context
    return evt => {
      evt.preventDefault()
      context.u.getUserWithOAuthRedirectHandler(provider).catch(context.app.alertFromError).done()
    }
  },
  render () {
    var u = this.context.u
    var user = u.user || {}
    var userParam = user.nick || user['.key']
    return (
      <nav className="navbar navbar-default">
        <div className="container">
          <div className="navbar-header">
            {/*<button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>*/}
            <a className="navbar-brand" href="#">dbtag</a>
          </div>

          <div className="navbar-collapse" id="navbar-collapse">
            {u.isLoggedIn()
              ? (
                  <div className="navbar-right">
                    <span className="navbar-text">Browsing as</span>
                    <div className="btn-group btn-sm">
                      <Link to={`/user/${userParam}`} className="btn btn-danger">{userParam}</Link>
                      <button type="button" className="btn btn-danger dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span className="caret"></span>
                        <span className="sr-only">Toggle Dropdown</span>
                      </button>
                      <ul className="dropdown-menu">
                        <li><Link to="/settings">Settings</Link></li>
                        <li role="separator" className="divider"></li>
                        <li><a href="" onClick={this.handleLogout}>Logout</a></li>
                      </ul>
                    </div>
                  </div>
                )
              : (
                  <div>
                    <p className="navbar-text navbar-right">Browsing as anonymous</p>
                    <form onSubmit={this.handleLogin} className="navbar-form navbar-right" role="search">
                      <div className="form-group">
                        <input className="form-control" onChange={this.handleEmailFormChange} name="email" value={this.state.emailForm.email} placeholder="Email" />
                      </div>
                      {' '}
                      <div className="form-group">
                        <input className="form-control" onChange={this.handleEmailFormChange} name="password" value={this.state.emailForm.password} type="password" placeholder="Password" />
                      </div>
                      {' '}
                      <button className="btn btn-primary">Login</button>
                      {' '}
                      <button onClick={this.handleRegister} className="btn btn-danger">Register</button>
                    </form>
                  </div>
                )
            }
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
