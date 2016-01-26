'use strict'

import React from 'react'
import {Table, Column, Cell} from 'fixed-data-table'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'

import contextTypes from './contextTypes'

import SortHeader from './SortHeader.jsx'
import HeaderCell from './HeaderCell.jsx'

export default React.createClass({
  contextTypes: contextTypes,
  statics: {
    initialState: {
      ls: [],
      sort: {columnKey: 'PID', sortDir: SortHeader.SortTypes.ASC},
      lsInterval: moment.duration(1, 'seconds'),
      tableWidth: 940,
      tableMaxHeight: 500,
      tableMarginBottom: 15
    }
  },
  getInitialState () { return this.constructor.initialState },
  componentDidMount () {
    this.setState(_.merge({}, this.state, JSON.parse(localStorage[this.constructor.displayName] || '{}')))
    this.pollLs()
    $(window).resize(this.onResize); this.onResize()
  },
  componentWillUpdate (props, state) {
    localStorage[this.constructor.displayName] = JSON.stringify(_.pick(state, props.stateFilterKeys))
  },
  componentWillUnmount () {
    clearTimeout(this.state.lsTimeoutRef)
    $(window).off('resize', this.onResize)
  },
  pollLs () {
    $.ajax({method: 'GET', url: 'api/lsoh', dataType: 'json'})
      .done(ls => { this.setState({ls}) })
      .fail(this.context.app.handleJQueryAjaxFail)
    this.state.lsTimeoutRef = setTimeout(this.pollLs, +this.state.lsInterval)
  },

  onResize () {
    this.setState({
      tableWidth: this.refs.tableContainer.clientWidth,
      tableMaxHeight: window.innerHeight - $(this.refs.tableContainer).offset().top - this.state.tableMarginBottom
    })
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
        {children || this.state.ls[rowIndex][columnKey]}
      </Cell>
    )
  },
  render () {
    var state = this.state
    const BodyCell = this.renderBodyCell
    const SortHeaderCell = this.renderSortHeaderCell
    return (
      <div ref="root">
        <div ref="tableContainer">
          <Table
            width={state.tableWidth}
            maxHeight={state.tableMaxHeight}
            headerHeight={50}
            rowsCount={state.ls.length}
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
