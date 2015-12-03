import Firebase from 'firebase'

import React from 'react'
import ReactFireMixin from 'reactfire'
import { Link } from 'react-router'

var ref = new Firebase('https://dbtag.firebaseio.com')

export default React.createClass({
  mixins: [ReactFireMixin],
  getInitialState () {
    return {
      post: null
    }
  },
  render () {
    return (
      <div>
        <div className="page-header">
          <h2>
            {this.state.post ? `Post ${this.state.post}` : "Loading post"}
            <span className="pull-right">
              <Link to="/" className="btn btn-primary">Back to latest posts &raquo;</Link>
            </span>
          </h2>
        </div>
        {this.state.post
          ? (
              <pre>{JSON.stringify(this.state.post)}</pre>
            )
          : (
              <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
            )
        }
      </div>
    )
  }
})
