import React from 'react'
import { Link } from 'react-router'

import url from 'url'
import moment from 'moment'

import Tags from './Tags.jsx'

export default React.createClass({
  getPath () {
    var postKey = (this.props.post || {})['.key']
    if (!postKey) return
    return `posts/${postKey}`
  },
  render () {
    var props = this.props
    var post = props.post || {}
    var path = this.getPath()
    var postedDate = moment(post.postedDate)
    return (
      <div className="media">
        <div className="media-body">
          {!path
            ? ""
            : (
              <dl className="dl-horizontal dl-horizontal-right pull-right text-muted">
                <dt><span className="glyphicon glyphicon-tag" aria-hidden="true"></span></dt>
                <dd><Tags forPath={path} dbtag={props.dbtag} /></dd>
                <dt><span className="glyphicon glyphicon-comment" aria-hidden="true"></span></dt>
                <dd>{props.commentsText
                  ? "comments"
                  : (
                    <Link to={path}>comments</Link>
                  )
                }</dd>
                <dt><span className="glyphicon glyphicon-time" aria-hidden="true"></span></dt>
                <dd title={postedDate.format('lll')}>{postedDate.fromNow()}</dd>
                <dt><span className="glyphicon glyphicon-globe" aria-hidden="true"></span></dt>
                <dd>{url.parse(post.url || '').hostname}</dd>
              </dl>
            )
          }
          <h2 className="media-heading">
            <a href={post.url} target="_blank">{post.title}</a>
            <p>{post.description}</p>
          </h2>
        </div>
      </div>
    )
  }
})
