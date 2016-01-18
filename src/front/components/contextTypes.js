import React from 'react'

export default {
  app: React.PropTypes.shape({render: React.PropTypes.func.isRequired}), // React.PropTypes.instanceOf(require('./App.jsx'))
  history: React.PropTypes.shape({push: React.PropTypes.func.isRequired})
}
