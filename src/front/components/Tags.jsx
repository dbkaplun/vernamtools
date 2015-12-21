import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

import _ from 'lodash'
import Promise from 'bluebird'

import contextTypes from './contextTypes'
import validateFirebaseKey from '../../validateFirebaseKey'

export default React.createClass({
  mixins: [ReactFireMixin],
  contextTypes: contextTypes,
  getInitialState () {
    return {
      tags: {},
      newTag: '',
      newTagFormVisible: false,
      alwaysShowTags: _(['+1', 'lol', '-1']).object().mapValues(_.constant(true)).value()
    }
  },
  componentDidMount () {
    this.fbRef = this.context.fbRef.child(`tags/${encodeURIComponent(this.props.forPath)}`)
    this.bindAsObject(this.fbRef, 'tags')
  },
  shouldComponentUpdate (nextProps, nextState) {
    nextState.tags = _.merge(nextState.tags, _.reduce(nextState.alwaysShowTags, (alwaysShowTags, _, tag) => {
      alwaysShowTags[encodeURIComponent(tag)] = {}
      return alwaysShowTags
    }, {}))
    return true
  },
  usersTagged (tag) {
    return _.pick(this.state.tags[encodeURIComponent(tag)], Boolean)
  },
  toggleTag (tag, val) {
    var self = this
    return new Promise((resolve, reject) => {
      if (!validateFirebaseKey(tag)) return reject(_.merge(new Error("Invalid tag.")))
      var u = self.context.u
      if (!u.isLoggedIn()) return reject(new Error("Please login before tagging."))
      var userKey = u.user['.key']
      self.fbRef.child(encodeURIComponent(tag)).transaction(users => {
        users = users || {}
        if (typeof val === 'undefined') val = !users[userKey]
        if (val) users[userKey] = Date.now()
        else delete users[userKey]
        return users
      }, function (err, committed, snapshot) {
        if (err) return reject(err)
        else if (!committed) return reject(new Error("Something went wrong, try again!"))
        resolve(snapshot)
      })
    })
  },
  toggleTagHandler (tag, evt) {
    if (evt) evt.preventDefault()
    var self = this
    self.toggleTag(tag).catch(self.context.app.alertFromError).done()
  },
  setNewTagFormVisibility (visible, evt) {
    if (evt) evt.preventDefault()
    this.setState({newTagFormVisible: visible})
  },
  handleNewTagInputKeyDown (evt) {
    if (evt.keyCode === 27) this.setNewTagFormVisibility(false)
  },
  submitNewTagForm (evt) {
    if (evt) evt.preventDefault()
    var self = this
    var newTag = self.state.newTag
    if (newTag) self.toggleTag(newTag, true)
      .tap(() => { self.setState({newTag: ''}) })
      .catch(self.context.app.alertFromError)
      .done()
    else self.setNewTagFormVisibility(false)
  },
  updateNewTag (evt) {
    this.setState({newTag: evt.target.value})
  },
  render () {
    var self = this
    var state = self.state
    var newTagFormVisible = state.newTagFormVisible
    var u = self.context.u
    var loggedIn = u.isLoggedIn()
    return (
      <span className="tags">
        <span>
          {_.map(state.tags, (users, tag) => {
            var reactKey = tag
            tag = decodeURIComponent(tag)
            var count = Object.keys(self.usersTagged(tag)).length
            if (!validateFirebaseKey(tag) || !(count || state.alwaysShowTags[tag])) return ''
            return (
              <span key={reactKey}>
                <a
                  onClick={self.toggleTagHandler.bind(self, tag)}
                  className={`tag label label-${count ? loggedIn && users[u.user['.key']] ? 'danger' : 'primary' : 'default'}`}>
                  {tag}
                  <small className={`muted ${count > 1 ? '' : 'hide'}`}> x {count}</small>
                </a>
                {' '}
              </span>
            )
          })}
        </span>
        <a onClick={self.setNewTagFormVisibility.bind(self, true)} className={loggedIn && !newTagFormVisible ? '' : 'hide'}>add new tag</a>
        <form onSubmit={self.submitNewTagForm} className={newTagFormVisible ? '' : 'hide'}>
          <input
            value={state.newTag}
            onChange={self.updateNewTag}
            onBlur={self.setNewTagFormVisibility.bind(self, false)}
            onKeyDown={self.handleNewTagInputKeyDown}
            ref={input => { if (input && newTagFormVisible) input.focus() }}
            className="form-control input-sm" />
        </form>
      </span>
    )
  }
})
