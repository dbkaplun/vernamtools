import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import PostHeader from './PostHeader.jsx'
import CommentForm from './CommentForm.jsx'
import CommentTree from './CommentTree.jsx'

export default React.createClass({
  mixins: [ReactFireMixin],
  getInitialState () {
    return {
      post: {
        title: "Loading post..."
      },
      commentFormVisible: false
    }
  },
  getPath () {
    var postKey = ((this.state || {}).post || {})['.key'] || this.props.params.postKey
    return `posts/${postKey}`
  },
  componentDidMount () {
    var path = this.getPath()
    if (!path) throw new Error("postKey prop required")
    this.bindAsObject(this.props.dbtag.fbRef.child(path), 'post')
  },
  toggleCommentFormVisible (evt) {
    if (evt) evt.preventDefault()
    this.setState({commentFormVisible: !this.state.commentFormVisible})
  },
  render () {
    var post = this.state.post
    var dbtag = this.props.dbtag
    var commentFormVisible = this.state.commentFormVisible
    var path = this.getPath()
    return (
      <div>
        <ol className="breadcrumb">
          <li><Link to="/">Latest posts</Link></li>
          <li className="active"><a href={window.location}>{post.title || post.url}</a></li>
        </ol>
        <PostHeader post={post} commentsText={true} dbtag={dbtag} />
        {post
          ? (
              <div>
                <CommentForm
                  forPath={path}
                  dbtag={dbtag}
                  className={commentFormVisible ? '' : 'hide'}
                  toggleVisible={this.toggleCommentFormVisible} />
                <h2>
                  <button
                    onClick={this.toggleCommentFormVisible}
                    className={`btn btn-primary pull-right ${commentFormVisible ? 'hide' : ''}`}>
                    Post a comment &raquo;
                  </button>
                  Comments
                </h2>
                <CommentTree forPath={path} dbtag={dbtag} />
              </div>
            )
          : (
              <span className="glyphicon glyphicon-refresh" aria-hidden="true"></span>
            )
        }
      </div>
    )
  }
})