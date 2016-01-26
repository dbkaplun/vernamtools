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
            <span className="navbar-brand">webtop</span>
          </div>

          <div className="navbar-collapse" id="navbar-collapse">
            {/*<ul className="nav navbar-nav">
              <WebtopLink to="/ps" tag="li">Processes</WebtopLink>
              <WebtopLink to="/lsoh" tag="li">Handles</WebtopLink>*/}
              {/*<li><WebtopLink to="/settings" className="btn btn-danger navbar-btn btn-sm">Settings</WebtopLink></li>*/}
            {/*</ul>*/}
            <ul className="nav navbar-nav navbar-right">
              <li><a href="https://github.com/dbkaplun/webtop" title="★, source, issues" target="_blank" data-toggle="tooltip" data-placement="bottom">
                Github
              </a></li>
            </ul>
          </div>{/*.navbar-collapse*/}
        </div>{/*.container*/}
      </nav>
    )
  }
})
