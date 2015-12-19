import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import PostHeader from './PostHeader.jsx'

export default React.createClass({
  mixins: [ReactFireMixin],
  getInitialState () {
    return {
      posts: [],
      pageSize: 10
    }
  },
  componentDidMount () {
    this.bindAsArray(this.props.app.fbRef.child('posts')
      .orderByChild('createdDate')
      .limitToLast(this.state.pageSize), 'posts')
  },
  render () {
    return (
      <div>
        <div className="page-header">
          <h2>
            Latest posts
            <span className="pull-right">
              <Link to="/posts/create" className="btn btn-danger">Submit new post &raquo;</Link>
            </span>
          </h2>
        </div>
        {this.state.posts.map((post, postIndex) => (
          <PostHeader post={post} app={this.props.app} key={postIndex} />
        ))}
      </div>
    )
  }
})
