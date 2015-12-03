export default class {
  constructor (opts) {
    this.opts = opts
    this.getAuth()
    opts.base.onAuth(this.handleAuthData.bind(this))
    // if (!this.authData) opts.base.authAnonymously(this.handleAuth.bind(this))
  }
  getAuth () {
    this.handleAuthData(this.opts.base.getAuth())
  }
  get authData () {
    return this.opts.context.state[this.opts.state];
  }
  handleAuthData (authData) {
    console.log('authData', authData)
    var newState = {}
    newState[this.opts.state] = authData
    this.opts.context.setState(newState)
  }
  handleAuthError (err) {
    switch (err.code) {
      case 'INVALID_EMAIL':
      case 'INVALID_PASSWORD':
      case 'INVALID_USER':
        break
      default:
        console.error(err.code, err)
    }
    alert(err.message)
  }
  handleAuth (err, authData) {
    if (err) this.handleAuthError(err)
    this.handleAuthData(authData)
  }
  authWithOAuthRedirectHandler (provider) {
    return this.opts.base.authWithOAuthRedirect(provider, this.handleAuth.bind(this))
  }
}
