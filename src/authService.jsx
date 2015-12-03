export default class {
  constructor (opts) {
    this.opts = opts
    this.getAuth()
    opts.ref.onAuth(this.handleAuthData.bind(this))
    // if (!this.authData) opts.ref.authAnonymously(this.handleAuth.bind(this))
  }
  getAuth () {
    this.handleAuthData(this.opts.ref.getAuth())
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
    return this.opts.ref.authWithOAuthRedirect(provider, this.handleAuth.bind(this))
  }
}
