import React from 'react'

import WebtopLink from './WebtopLink.jsx'
import contextTypes from './contextTypes'

export default React.createClass({
  contextTypes: contextTypes,
  render () {
    return (
      <nav className="navbar navbar-default navbar-static-top">
        <div className="container">
          <div className="navbar-header">
            {/*<button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>*/}
            <WebtopLink to="/" title="Go to main page" className="navbar-brand" data-toggle="tooltip" data-placement="bottom">webtop</WebtopLink>
          </div>

          <div className="navbar-collapse" id="navbar-collapse">
            <ul className="nav navbar-nav">
              <li><a href="https://github.com/dbkaplun/webtop" target="_blank" title="★, source, issues" data-toggle="tooltip" data-placement="bottom">Github</a></li>
            </ul>
            {/*<ul className="nav navbar-nav navbar-right">
              <li><WebtopLink to="/settings" className="btn btn-danger navbar-btn btn-sm">Settings</WebtopLink></li>
            </ul>*/}
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
