import React from 'react'
import {Link} from 'react-router'

import contextTypes from './contextTypes'

export default React.createClass({
  contextTypes: contextTypes,
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
            <a className="navbar-brand" href="#">webtop</a>
          </div>

          <div className="navbar-collapse" id="navbar-collapse">
            <div className="navbar-right">
              <Link to="/settings" className="btn btn-danger navbar-btn btn-sm">Settings</Link>
            </div>
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
