import React from 'react'

import SimpleMDE from 'simplemde'

export default React.createClass({
  getInitialState () {
    return {
      comment: {raw: ''}
    }
  },
  postCommentForm (evt) {
    evt.preventDefault()
    var self = this
    var app = self.props.app
    if (!app.u.isLoggedIn()) {
      app.alertFromError(new Error("Please login before posting a comment."))
      return
    }
    var comment = self.state.comment
    comment.userKey = app.u.user['.key']
    return app.fbRef.child(`comments/${encodeURIComponent(self.props.forPath)}`).push(comment, err => {
      if (err) {
        app.alertFromError(err)
        return
      }
      self.props.toggleVisible()
    })
  },
  initCommentEditor (textarea) {
    var self = this
    var state = this.state
    var simplemde = state.simplemde
    if (!simplemde) {
      simplemde = state.simplemde = new SimpleMDE({element: textarea})
      simplemde.codemirror.on('change', () => {
        state.comment.raw = simplemde.value()
        self.setState(state)
      })
    }
  },
  render () {
    var state = this.state
    return (
      <form onSubmit={this.postCommentForm} className={this.props.className}>
        <div className="form-group">
          <textarea value={state.comment.raw} ref={this.initCommentEditor} className="form-control" />
        </div>
        <button type="submit" className="btn btn-success">Post</button>
        {' '}
        <button onClick={this.props.toggleVisible} className="btn btn-default">Cancel</button>
      </form>
    )
  }
})
