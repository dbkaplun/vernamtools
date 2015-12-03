import React from 'react'
import Rebase from 're-base'

var base = Rebase.createClass('https://dbtag.firebaseio.com')

export default React.createClass({
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
