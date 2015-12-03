import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link } from 'react-router'
import Rebase from 're-base'

var base = Rebase.createClass('https://dbtag.firebaseio.com')

const PostList = React.createClass({
  getInitialState () {
    return {
      posts: []
    }
  },
  componentDidMount () {
    base.bindToState('posts', {
      context: this,
      state: 'posts',
      asArray: true
    })
  },
  render () {
    return (
      <div>
        <h2>Latest posts</h2>
        <ul>
          {this.state.posts.map((post, i) => (
            <li key={i}>{post}</li>
          ))}
        </ul>
      </div>
    )
  }
})

ReactDOM.render((
  <Router>
    <Route path="/" component={PostList} />
  </Router>
), document.getElementById('content'))
