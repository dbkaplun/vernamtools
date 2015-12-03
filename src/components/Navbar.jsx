import Firebase from 'firebase'

import React from 'react'
import ReactAuthService from '../authService.jsx'

var ref = new Firebase('https://dbtag.firebaseio.com')

export default React.createClass({
  getInitialState () {
    return {
      emailForm: {
        email: '',
        password: ''
      },
      authData: null
    }
  },
  componentDidMount () {
    this.auth = new ReactAuthService({
      ref: ref,
      context: this,
      state: 'authData'
    })
  },
  handleRegister (evt) {
    evt.preventDefault()
    var self = this
    ref.createUser(this.state.emailForm, function (err) {
      if (err) return self.auth.handleAuthError(err)
      self.handleLogin(evt)
    })
  },
  handleLogin (evt) {
    evt.preventDefault()
    ref.authWithPassword(this.state.emailForm, this.auth.handleAuth.bind(this.auth))
  },
  handleLogout (evt) {
    evt.preventDefault()
    ref.unauth()
  },
  handleEmailFormChange (evt) {
    evt.preventDefault()
    this.state.emailForm[evt.target.name] = evt.target.value
    this.setState({emailForm: this.state.emailForm})
  },
  oAuthHandler (provider) {
    throw new Error("not implemented")
    var self = this
    return function (evt) {
      evt.preventDefault()
      self.auth.authWithOAuthRedirectHandler(provider)
    }
  },
  render () {
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
            <form onSubmit={this.handleLogin} className="navbar-form navbar-right" role="search">
              {this.state.authData
                ? (
                    <button onClick={this.handleLogout} className="btn btn-default">Logout</button>
                  )
                : (
                    <div>
                      <div className="form-group">
                        <input className="form-control" onChange={this.handleEmailFormChange} name="email" value={this.state.emailForm.email} placeholder="Email" />
                      </div>
                      {' '}
                      <div className="form-group">
                        <input className="form-control" onChange={this.handleEmailFormChange} name="password" value={this.state.emailForm.password} type="password" placeholder="Password" />
                      </div>
                      {' '}
                      <button className="btn btn-success">Login</button>
                      {' '}
                      <button onClick={this.handleRegister} className="btn btn-danger">Register</button>
                    </div>
                  )
              }
            </form>
            <p className="navbar-text navbar-right">Browsing as {this.state.authData ? this.state.authData[this.state.authData.provider].email : 'anonymous'}</p>
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
