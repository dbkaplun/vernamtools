import React from 'react'

import WebtopLink from './WebtopLink.jsx'
import contextTypes from './contextTypes'

export default React.createClass({
  contextTypes: contextTypes,
  render () {
    return (
      <div>
        <div className="page-header">
          <h2>
            Settings
            <span className="pull-right">
              <WebtopLink to="/" className="btn btn-primary" index={true}>Home &raquo;</WebtopLink>
            </span>
          </h2>
        </div>
        TODO: add stuff here
      </div>
    )
  }
})
