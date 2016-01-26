'use strict'

import React from 'react'
import {Table, Column, Cell} from 'fixed-data-table'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'

import contextTypes from './contextTypes'
import lsoiCols from '../../lsoiCols'

import SortHeader from './SortHeader.jsx'
import HeaderCell from './HeaderCell.jsx'

export default React.createClass({
  contextTypes: contextTypes,
  statics: {
    initialState: {
      hs: [],
      // generated directly from hs in componentWillUpdate
      displayHs: [],

      sort: {columnKey: 'PID', sortDir: SortHeader.SortTypes.ASC},
      filter: '',
      hsInterval: moment.duration(1, 'seconds'),
      tableWidth: 940,
      tableMaxHeight: 500,
      tableMarginBottom: 15
    }
  },
  getInitialState () { return this.constructor.initialState },
  getDefaultProps () {
    return {stateFilterKeys: ['sort', 'filter']}
  },
  componentDidMount () {
    this.setState(_.merge({}, this.state, JSON.parse(localStorage[this.constructor.displayName] || '{}')))
    this.pollHs()
    $(window).resize(this.onResize); this.onResize()
  },
  componentWillUpdate (props, state) {
    var sort = state.sort

    // begin displayHs computation
    var displayHs = state.hs.map(h => ({item: h}))
    // items have no unique values so selection is impossible
    // maybe that can be mitigated with a composite key to index rows

    // now we filter and sort a complete displayHs
    displayHs = displayHs.filter(dh => (
      _.some(dh.item, val => (
        val.toString().toLowerCase().indexOf(state.filter.toLowerCase()) !== -1
      ))
    ))

    displayHs.sort((dhA, dhB) => {
      var aVal = dhA.item[sort.columnKey]
      var bVal = dhB.item[sort.columnKey]
      var cmp = lsoiCols[sort.columnKey] === 'number'
        ? Math.sign(aVal - bVal)
        : aVal.localeCompare(bVal)
      return cmp * (sort.sortDir === SortHeader.SortTypes.DESC ? 1 : -1)
    })

    state.displayHs = displayHs
    // end displayHs computation

    localStorage[this.constructor.displayName] = JSON.stringify(_.pick(state, props.stateFilterKeys))
  },
  componentWillUnmount () {
    clearTimeout(this.state.hsTimeoutRef)
    $(window).off('resize', this.onResize)
  },
  pollHs () {
    $.ajax({method: 'GET', url: 'api/lsoh', dataType: 'json'})
      .done(hs => { this.setState({hs}) })
      .fail(this.context.app.handleJQueryAjaxFail)
    this.state.hsTimeoutRef = setTimeout(this.pollHs, +this.state.hsInterval)
  },

  onResize () {
    this.setState({
      tableWidth: this.refs.tableContainer.clientWidth,
      tableMaxHeight: window.innerHeight - $(this.refs.tableContainer).offset().top - this.state.tableMarginBottom
    })
  },
  setFilter (evt) {
    this.setState({filter: evt.target.value})
  },
  onSortChange (columnKey, sortDir) {
    this.setState({sort: {columnKey, sortDir}, treeView: false})
  },

  renderSortHeaderCell ({columnKey, children, ...props}) {
    var state = this.state
    var sort = state.sort
    return (
      <HeaderCell {...props} columnKey={columnKey}>
        <SortHeader {...props}
          columnKey={columnKey}
          sortDir={sort.columnKey === columnKey && sort.sortDir}
          onSortChange={this.onSortChange}>
          {children || columnKey}
        </SortHeader>
      </HeaderCell>
    )
  },
  renderBodyCell ({columnKey, rowIndex, children, ...props}) {
    return (
      <Cell {...props}
        className={`column-${columnKey}-body-cell`}>
        {children || this.state.displayHs[rowIndex].item[columnKey]}
      </Cell>
    )
  },
  render () {
    var state = this.state
    var displayHs = state.displayHs
    const BodyCell = this.renderBodyCell
    const SortHeaderCell = this.renderSortHeaderCell
    return (
      <div ref="root">
        <div className="clearfix media-heading">
          <div className="input-group col-xs-4 pull-right">
            <span className="input-group-addon"><span className="glyphicon glyphicon-search" aria-hidden="true"></span></span>
            <input placeholder="Filter handles..." type="text" className="form-control" value={state.filter} onChange={this.setFilter} aria-label="Filter handles" />
          </div>
        </div>
        <div ref="tableContainer">
          <Table
            width={state.tableWidth}
            maxHeight={state.tableMaxHeight}
            headerHeight={50}
            rowsCount={displayHs.length}
            rowHeight={36 /* FIXME: duplicated in ../less/tables.less */}>
            <Column
              fixed={true}
              columnKey="NAME"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="PID"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="TYPE"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="NODE"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="COMMAND"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="USER"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="FD"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="DEVICE"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="SIZE/OFF"
              header={SortHeaderCell}
              cell={BodyCell}
              width={100} />
          </Table>
        </div>
      </div>
    )
  }
})
