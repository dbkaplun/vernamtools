import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link } from 'react-router'

const Content = React.createClass({
  render () {
    return (
      <div>
        <h2>Content</h2>
      </div>
    )
  }
})

ReactDOM.render((
  <Router>
    <Route path="/" component={Content} />
  </Router>
), document.getElementById('content'))
