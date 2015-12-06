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
      post: {
        title: "Loading post..."
      }
    }
  },
  componentDidMount () {
    var postId = (this.state.post || {})['.key'] || this.props.params.postId
    this.bindAsObject(ref.child(`posts/${postId}`), 'post')
  },
  render () {
    var post = this.state.post || {}
    var postKey = post['.key']
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to="/">Latest posts</Link></li>
          <li className="active">{postKey ? `Post #${postKey}` : "Loading post..."}</li>
        </ol>
        <PostHeader post={post} commentsText={true} />
        {post
          ? ""
          : (
              <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span>
            )
        }
      </div>
    )
  }
})
