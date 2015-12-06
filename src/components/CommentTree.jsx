import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import moment from 'moment'
import marked from 'marked'
import SimpleMDE from 'simplemde'

import CommentForm from './CommentForm.jsx'

var CommentTree = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState () {
    return {comments: []}
  },
  componentDidMount () {
    this.fbRef = this.props.dbtag.fbRef.child(`comments/${encodeURIComponent(this.props.forPath)}`)
    this.bindAsArray(this.fbRef, 'comments')
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
    var state = self.state
    var dbtag = self.props.dbtag
    return (
      <ul className={`comment-list media-list ${this.props.className}`}>
        {state.comments.map((comment, commentIndex) => {
          var postedDate = moment(comment.postedDate)
          var path = `comments/${comment['.key']}`
          return (
            <li className="media" key={commentIndex}>
              <div tabIndex="-1" className={`media-body comment comment-${comment._folded ? '' : 'un'}folded`}>
                <h5 className="media-heading">
                  <small><a onClick={self.toggleCommentPropHandler(comment, '_folded')}>[{comment._folded ? '+' : '-'}]</a></small>
                  {' '}
                  <Link to={`users/${comment.uid}`}>{comment.uid}</Link>
                  <small title={postedDate.format('lll')}>, {postedDate.fromNow()}</small>
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
                    dbtag={dbtag}
                    className={comment._replyFormVisible ? '' : 'hide'}
                    toggleVisible={self.toggleCommentPropHandler(comment, '_replyFormVisible')} />
                </div>
              </div>
              <CommentTree forPath={path} dbtag={dbtag} className={comment._folded ? 'hide' : ''} />
            </li>
          )
        })}
      </ul>
    )
  }
})

export default CommentTree
