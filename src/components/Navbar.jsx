import React from 'react'

export default React.createClass({
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
    var dbtag = self.props.dbtag

    dbtag.fbRef.createUserAsync(this.state.emailForm)
      .then(this.authWithEmailForm)
      .catch(dbtag.alertFromError)
      .done()
  },
  authWithEmailForm () {
    return this.props.dbtag.authWithPassword(this.state.emailForm)
  },
  handleLogin (evt) {
    evt.preventDefault()
    this.authWithEmailForm()
      .catch(err => { console.error(err) })
      .done()
  },
  handleLogout (evt) {
    evt.preventDefault()
    this.props.dbtag.fbRef.unauth()
    this.render()
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
    return evt => {
      evt.preventDefault()
      self.props.dbtag.authWithOAuthRedirectHandler(provider)
        .catch(err => { console.error(err) })
        .done()
    }
  },
  render () {
    var user = this.props.dbtag.state.user
    var loggedIn = user && !user.anonymous
    var displayName = loggedIn && ((user[user.provider] || {}).email || user.uid) || "anonymous"
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
              {loggedIn
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
            <p className="navbar-text navbar-right">Browsing as {displayName}</p>
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
