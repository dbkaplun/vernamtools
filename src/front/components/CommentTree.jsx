import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import Promise from 'bluebird'
import moment from 'moment'
import marked from 'marked'
import SimpleMDE from 'simplemde'

import contextTypes from './contextTypes'
import CommentForm from './CommentForm.jsx'

var CommentTree = React.createClass({
  mixins: [ReactFireMixin],
  contextTypes: contextTypes,
  getInitialState () {
    return {comments: []}
  },
  componentDidMount () {
    this.fbRef = this.context.fbRef.child(`comments/${encodeURIComponent(this.props.forPath)}`)
    this.bindAsArray(this.fbRef, 'comments')
  },
  componentWillUpdate (props, state) {
    var self = this
    var context = self.context
    Promise.map(state.comments, comment => {
      return comment._user || context.u.getUserByKey(comment.userKey)
        .tap(user => {
          comment._user = user
          self.forceUpdate()
        })
        .catch(context.app.alertFromError)
    }).done()
  },
  toggleCommentPropHandler (comment, prop) {
    var self = this
    return evt => {
      if (evt) evt.preventDefault()
      comment[prop] = !comment[prop]
      self.setState(self.state)
    }
  },
  initCommentPreview (comment, textarea) {
    var simplemde = comment._simplemde
    if (!simplemde) {
      simplemde = comment._simplemde = new SimpleMDE({
        element: textarea,
        toolbar: false,
        status: false
      })
      // simplemde.togglePreview() // FIXME
    }
  },
  render () {
    var self = this
    return (
      <ul className={`comment-list media-list ${this.props.className}`}>
        {self.state.comments.map((comment, commentIndex) => {
          var createdDate = moment(comment.createdDate)
          var path = `comments/${comment['.key']}`
          return (
            <li className="media" key={commentIndex}>
              <div tabIndex="-1" className={`media-body comment comment-${comment._folded ? '' : 'un'}folded`}>
                <h5 className="media-heading">
                  <small><a onClick={self.toggleCommentPropHandler(comment, '_folded')}>[{comment._folded ? '+' : '-'}]</a></small>
                  {' '}
                  <Link to={`users/${comment.userKey}`}>{(comment._user || {}).nick || comment.userKey}</Link>
                  <small title={createdDate.format('lll')}>, {createdDate.fromNow()}</small>
                </h5>
                <div className={comment._folded ? 'hide' : ''}>
                  <textarea value={comment.raw} readOnly className={`comment-raw form-control ${comment._viewSource ? '' : 'hide'}`} />
                  <div className={`comment-rendered ${comment._viewSource ? 'hide' : ''}`} dangerouslySetInnerHTML={{__html: marked(comment.raw)}} />
                  <div className="comment-actions">
                    <a onClick={self.toggleCommentPropHandler(comment, '_replyFormVisible')}>{comment._replyFormVisible ? 'cancel ' : ''}reply</a>
                    {' '}&bull;{' '}
                    <a onClick={self.toggleCommentPropHandler(comment, '_viewSource')}>{comment._viewSource ? 'hide' : 'view'} source</a>
                  </div>
                  <CommentForm
                    forPath={path}
                    className={comment._replyFormVisible ? '' : 'hide'}
                    toggleVisible={self.toggleCommentPropHandler(comment, '_replyFormVisible')} />
                </div>
              </div>
              <CommentTree forPath={path} className={comment._folded ? 'hide' : ''} />
            </li>
          )
        })}
      </ul>
    )
  }
})

export default CommentTree
