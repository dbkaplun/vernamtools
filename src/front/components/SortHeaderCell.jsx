import React from 'react'
import _ from 'lodash'

export default React.createClass({
  statics: {
    SortTypes: {
      ASC: 'ASC',
      DESC: 'DESC'
    },
    reverseSortDirection (sortDir) {
      var SortTypes = this.SortTypes
      return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC
    }
  },
  _onSortChange () {
    (this.props.onSortChange || _.noop)(
      this.props.columnKey,
      this.props.sortDir
        ? this.constructor.reverseSortDirection(this.props.sortDir)
        : this.constructor.SortTypes.DESC
    )
  },
  render () {
    var {sortDir, children, ...props} = this.props
    return (
      <span {...props} className="sort-header-cell" onClick={this._onSortChange}>
        {children} {sortDir ? (sortDir === this.constructor.SortTypes.DESC ? '↓' : '↑') : ''}
      </span>
    )
  }
})
