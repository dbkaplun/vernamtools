import url from 'url'
import moment from 'moment'

import React from 'react'
import { Link } from 'react-router'

export default React.createClass({
  render () {
    var props = this.props
    var post = props.post || {}
    var postedDate = moment(post.postedDate)
    return (
      <div className="media">
        <div className="media-body">
          {!post['.key']
            ? ""
            : (
              <dl className="dl-horizontal pull-right text-muted">
                <dt><span className="glyphicon glyphicon-comment" aria-hidden="true"></span></dt>
                <dd>{this.props.commentsText
                  ? "comments"
                  : (
                    <Link to={`/post/${post['.key']}`}>comments</Link>
                  )
                }</dd>
                <dt><span className="glyphicon glyphicon-time" aria-hidden="true"></span></dt>
                <dd title={postedDate.format('lll')}>{postedDate.fromNow()}</dd>
                <dt><span className="glyphicon glyphicon-globe" aria-hidden="true"></span></dt>
                <dd>{url.parse(post.url).hostname}</dd>
              </dl>
            )
          }
          <h2 className="media-heading">
            <div><a href={post.url} target="_blank">{post.title}</a></div>
            <small>
              {(post.tags || []).map((tag, tagIndex) => (
                <span key={tagIndex}>
                  <span className="label label-primary">{tag}</span>
                  {' '}
                </span>
              ))}
            </small>
          </h2>
        </div>
      </div>
    )
  }
})
