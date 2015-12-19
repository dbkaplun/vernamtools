import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'
import TagsInput from 'react-tagsinput'

import _ from 'lodash'

export default React.createClass({
  getInitialState () {
    return {
      postForm: {
        url: '',
        tags: [],
        createdDate: Date.now()
      }
    }
  },
  handlePostCreateFormChange (evt) {
    evt.preventDefault()
    var self = this
    var state = self.state
    var postForm = state.postForm
    postForm[evt.target.name] = evt.target.value
    self.setState(state)
  },
  handlePostCreateFormSubmit (evt) {
    evt.preventDefault()
    var postForm = this.state.postForm
    postForm.createdDate = Date.now()
    var postRef = this.props.app.fbRef.child('posts').push(postForm, err => {
      if (err) return alert(err.toString())
      window.location = `#/posts/${postRef.key()}`
    })
  },
  handleTagsChange (tags) {
    var postForm = this.state.postForm
    postForm.tags = tags
    this.setState({postForm})
  },
  render () {
    var state = this.state
    var postForm = state.postForm
    return (
      <form onSubmit={this.handlePostCreateFormSubmit} className="form-horizontal">
        <div className="page-header">
          <h2>
            Create post
            <span className="pull-right">
              <Link to="/" className="btn btn-primary">Back to latest posts &raquo;</Link>
            </span>
          </h2>
        </div>
        <div className="form-group">
          <label htmlFor="post-create-form-url">URL <small className="text-muted">(required)</small></label>
          <input className="form-control" onChange={this.handlePostCreateFormChange} name="url" value={postForm.url} type="url" id="post-create-form-url" />
        </div>
        <div className="form-group">
          <label htmlFor="post-create-form-tags">Tags <small className="text-muted">(separated by <kbd>Enter</kbd>, <kbd>Tab</kbd>, or <kbd>Space</kbd>)</small></label>
          {/*<input className="form-control" onChange={this.handlePostCreateFormChange} name="tags" value={postForm.tags} id="post-create-form-tags" />*/}
          <TagsInput
            value={postForm.tags}
            onChange={this.handleTagsChange}
            addKeys={TagsInput.defaultProps.addKeys.concat([32])}
            className='form-control tag-container'
            tagProps={_.merge({}, TagsInput.defaultProps.tagProps, {
              className: 'label label-primary'
            })}
            inputProps={_.merge({}, TagsInput.defaultProps.inputProps, {id: 'post-create-form-tags'})} />
        </div>
        <button className="btn btn-primary">Submit</button>
      </form>
    )
  }
})
