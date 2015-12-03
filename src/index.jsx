import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link } from 'react-router'

import Navbar from './components/Navbar.jsx'
import PostList from './components/PostList.jsx'

ReactDOM.render((
  <Navbar />
), document.getElementById('navbar'))

ReactDOM.render((
  <Router>
    <Route path="/" component={PostList} />
  </Router>
), document.getElementById('content'))
