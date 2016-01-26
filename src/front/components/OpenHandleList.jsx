'use strict'

import React from 'react'
import {Table, Column, Cell} from 'fixed-data-table'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'

import contextTypes from './contextTypes'
import getSortCmp from './getSortCmp'
import lsoiCols from '../../lsoiCols'

import SortHeader from './SortHeader.jsx'
import HeaderCell from './HeaderCell.jsx'

export default React.createClass({
  contextTypes: contextTypes,
  statics: {
    lsohNameRE: /^(\S+?):(\S+?)(->(\S+?):(\S+?))?(\s*\((.*?)\))?$/,
    initialState: {
      hs: [],
      // generated directly from hs in componentWillUpdate
      displayHs: [],

      sort: {columnKey: 'status', sortDir: SortHeader.SortTypes.ASC},
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
    // begin displayHs computation
    var displayHs = state.hs.map(h => {
      let dh = {item: h}
      var match = h.NAME.match(this.constructor.lsohNameRE)
      if (!match) {
        console.error(h.NAME) // FIXME: log this somehow, this shouldn't happen
        return dh
      }
      let [, srcAddr, srcPort, , dstAddr, dstPort, , status] = match
      return _.merge(dh, {srcAddr, srcPort, dstAddr, dstPort, status})
    })
    // items have no unique values so selection is impossible
    // maybe that can be mitigated with a composite key to index rows

    // now we filter and sort a complete displayHs
    displayHs = displayHs.filter(dh => (
      _.some(dh.item, val => (
        val.toString().toLowerCase().indexOf(state.filter.toLowerCase()) !== -1
      ))
    ))

    var sort = state.sort
    var rawCol = sort.columnKey
    var match = rawCol.match(/^item\[(.*)\]$/)
    if (match) rawCol = JSON.parse(match[1])
    displayHs.sort(getSortCmp(sort, lsoiCols[rawCol]))

    state.displayHs = displayHs
    // end displayHs computation

    localStorage[this.constructor.displayName] = JSON.stringify(_.pick(state, props.stateFilterKeys))
  },
  componentWillUnmount () {
    _.result(this, 'hsAjaxRef.abort')
    clearTimeout(this.hsTimeoutRef)
    $(window).off('resize', this.onResize)
  },
  pollHs () {
    this.hsAjaxRef = $.ajax({method: 'GET', url: 'api/lsoh', dataType: 'json'})
      .done(hs => { this.setState({hs}) })
      .fail(this.context.app.handleJQueryAjaxFail)
    this.hsTimeoutRef = setTimeout(this.pollHs, +this.state.hsInterval)
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
    this.setState({sort: {columnKey, sortDir}})
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
  renderItemSortHeaderCell ({columnKey, ...props}) {
    const SortHeaderCell = this.renderSortHeaderCell
    return (
      <SortHeaderCell {...props} columnKey={`item[${JSON.stringify(columnKey)}]`}>{columnKey}</SortHeaderCell>
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
    const ItemSortHeaderCell = this.renderItemSortHeaderCell
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
              columnKey="SRC ADDR"
              header={({columnKey, ...props}) => (
                <SortHeaderCell columnKey="srcAddr" {...props}>{columnKey}</SortHeaderCell>
              )}
              cell={props => (
                <BodyCell {...props}>{displayHs[props.rowIndex].srcAddr}</BodyCell>
              )}
              width={125} />
            <Column
              fixed={true}
              columnKey="SRC PORT"
              header={({columnKey, ...props}) => (
                <SortHeaderCell columnKey="srcPort" {...props}>{columnKey}</SortHeaderCell>
              )}
              cell={props => (
                <BodyCell {...props}>{displayHs[props.rowIndex].srcPort}</BodyCell>
              )}
              width={100} />
            <Column
              columnKey="DST ADDR"
              header={({columnKey, ...props}) => (
                <SortHeaderCell columnKey="dstAddr" {...props}>{columnKey}</SortHeaderCell>
              )}
              cell={props => (
                <BodyCell {...props}>{displayHs[props.rowIndex].dstAddr}</BodyCell>
              )}
              width={150} />
            <Column
              columnKey="DST PORT"
              header={({columnKey, ...props}) => (
                <SortHeaderCell columnKey="dstPort" {...props}>{columnKey}</SortHeaderCell>
              )}
              cell={props => (
                <BodyCell {...props}>{displayHs[props.rowIndex].dstPort}</BodyCell>
              )}
              width={100} />
            <Column
              columnKey="STATUS"
              header={({columnKey, ...props}) => (
                <SortHeaderCell columnKey="status" {...props}>{columnKey}</SortHeaderCell>
              )}
              cell={props => (
                <BodyCell {...props}>{displayHs[props.rowIndex].status}</BodyCell>
              )}
              width={125} />
            <Column
              columnKey="PID"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={75} />
            <Column
              columnKey="TYPE"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={70} />
            <Column
              columnKey="NODE"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={70} />
            <Column
              columnKey="COMMAND"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={110} />
            <Column
              columnKey="USER"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={100} />
            <Column
              columnKey="FD"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={50} />
            <Column
              columnKey="DEVICE"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={150} />
            <Column
              columnKey="SIZE/OFF"
              header={ItemSortHeaderCell}
              cell={BodyCell}
              width={90} />
          </Table>
        </div>
      </div>
    )
  }
})
