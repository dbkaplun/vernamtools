import React from 'react'
import {Link} from 'react-router'

import _ from 'lodash'

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
              <Link to="/" className="btn btn-primary">Home &raquo;</Link>
            </span>
          </h2>
        </div>
        TODO: add stuff here
      </div>
    )
  }
})
