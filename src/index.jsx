import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route } from 'react-router'

import Navbar from './components/Navbar.jsx'
ReactDOM.render((
  <Navbar />
), document.getElementById('navbar'))

import PostList from './components/PostList.jsx'
import PostCreate from './components/PostCreate.jsx'
import PostDetail from './components/PostDetail.jsx'
ReactDOM.render((
  <Router>
    <Route path="/" component={PostList} />
    <Route path="/post" component={PostCreate} />
    <Route path="/post/:postId" component={PostDetail} />
  </Router>
), document.getElementById('content'))
