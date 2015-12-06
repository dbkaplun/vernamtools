import Firebase from 'firebase'

import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import PostHeader from './PostHeader.jsx'

var ref = new Firebase('https://dbtag.firebaseio.com')

export default React.createClass({
  mixins: [ReactFireMixin],
  getInitialState () {
    return {
      posts: [],
      pageSize: 10
    }
  },
  componentDidMount () {
    this.bindAsArray(ref.child('posts')
      .orderByChild('postedDate')
      .limitToLast(this.state.pageSize), 'posts')
  },
  render () {
    return (
      <div>
        <div className="page-header">
          <h2>
            Latest posts
            <span className="pull-right">
              <Link to="/post" className="btn btn-danger">Submit new post &raquo;</Link>
            </span>
          </h2>
        </div>
        {this.state.posts.map((post, postIndex) => (
          <PostHeader post={post} key={postIndex} />
        ))}
      </div>
    )
  }
})
