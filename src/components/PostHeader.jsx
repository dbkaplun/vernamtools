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
    var createdDate = moment(post.createdDate)
    return (
      <div className="media">
        <div className="media-body">
          <div className="row">
            <div className="col-xs-3">
              {!path
                ? ""
                : (
                  <dl className="dl-horizontal dl-horizontal-right text-muted">
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
                    <dd title={createdDate.format('lll')}>{createdDate.fromNow()}</dd>
                    <dt><span className="glyphicon glyphicon-globe" aria-hidden="true"></span></dt>
                    <dd>{url.parse(post.url || '').hostname}</dd>
                  </dl>
                )
              }
            </div>
            <div className="col-xs-9">
              <h2 className="media-heading">
                <a href={post.url} target="_blank">{post.title}</a>
              </h2>
              <p>{post.description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
