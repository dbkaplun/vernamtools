import React from 'react'

export default {
  app: React.PropTypes.object, // React.PropTypes.instanceOf(require('./App.jsx'))
  fbRef: React.PropTypes.instanceOf(require('firebase')),
  history: React.PropTypes.shape({push: React.PropTypes.func.isRequired}),
  u: React.PropTypes.instanceOf(require('../../UserService'))
}
