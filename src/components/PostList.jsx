import Firebase from 'firebase'
import moment from 'moment'

import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

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
        {this.state.posts.map((post, postIndex) => {
          post.postedDate = moment(post.postedDate)
          return (
            <div className="media" key={postIndex}>
              <div className="media-body">
                <span className="pull-right">
                  {post.tags.map((tag, tagIndex) => (
                    <span key={tagIndex}>
                      <span className="label label-primary">{tag}</span>
                      {' '}
                    </span>
                  ))}
                </span>
                <h3 className="media-heading">
                  <div><a href={post.url} target="_blank">{post.title}</a></div>
                  <small><span title={post.postedDate.format('lll')}><span className="glyphicon glyphicon-time" aria-hidden="true"></span> {post.postedDate.fromNow()}</span> &bull; <span><span className="glyphicon glyphicon-globe" aria-hidden="true"></span> {post.url}</span></small>
                </h3>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
})
