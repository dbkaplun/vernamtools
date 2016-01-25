import React from 'react'
import {Router, Route, IndexRedirect} from 'react-router'
import _ from 'lodash'

import createHashHistory from 'history/lib/createHashHistory'

import App from './App.jsx'
import ProcessList from './ProcessList.jsx'
import Settings from './Settings.jsx'

import contextTypes from './contextTypes'

export default React.createClass({
  childContextTypes: _.pick(contextTypes, 'history'),
  getChildContext () { return {history: this.history} },
  componentWillMount () {
    var self = this
    self.history = createHashHistory()
  },
  render () {
    return (
      <Router history={this.history}>
        <Route path="/" component={App}>
          <IndexRedirect to="ps" />
          <Route path="ps" component={ProcessList} />
          <Route path="settings" component={Settings} />
          {/*<Route path="*" component={NoMatch} />*/}
        </Route>
      </Router>
    )
  }
})
