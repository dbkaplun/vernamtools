'use strict'

import React from 'react'
import {Link} from 'react-router'
import {Table, Column, Cell} from 'fixed-data-table'
import path from 'path'
import _ from 'lodash'
import $ from 'jquery'
import moment from 'moment'
import unsplay from 'unsplay'

import contextTypes from './contextTypes'
import numericPsCols from '../../numericPsCols'
import arrayToObjectKeys from '../../arrayToObjectKeys'
import splayDepthFirst from '../../splayDepthFirst'

import SortHeaderCell from './SortHeaderCell.jsx'
const HeaderCell = ({columnKey, children, ...props}) => (
  <Cell {...props} columnKey={columnKey} className={`column-${columnKey}-header-cell`}>
    {children || columnKey}
  </Cell>
)

export default React.createClass({
  contextTypes: contextTypes,
  statics: {
    sumColumns: _.pick(numericPsCols, (tmp, col) => col.match(/^%/)),
    initialState: {
      ps: [],
      // generated directly from ps in componentWillUpdate
      displayPs: [],
      displayPsObj: {},

      selectedPIDs: {},
      foldedPIDs: {},
      visiblePIDs: {},
      hoverPID: null,
      fullCommand: false,
      treeView: false,
      showSelectedOnly: false,
      sort: {columnKey: '%CPU', sortDir: SortHeaderCell.SortTypes.ASC},
      filter: '',
      psInterval: moment.duration(1, 'seconds'),
      tableWidth: 940,
      tableMaxHeight: 500,
      tableMarginBottom: 15
    }
  },
  getInitialState () { return this.constructor.initialState },
  getDefaultProps () {
    return {
      stateFilterKeys: ['fullCommand', 'treeView', 'sort', 'filter']
    }
  },
  componentDidMount () {
    this.setState(_.merge({}, this.state, JSON.parse(localStorage.processList || '{}')))
    this.pollPS()
    $(window).resize(this.onResize); this.onResize()
  },
  componentWillUpdate (props, state) {
    var sort = state.sort

    // begin displayPs computation
    var displayPs = state.treeView
      ? splayDepthFirst(unsplay(state.ps, 'PID', 'PPID'))
      : state.ps.map(p => ({item: p}))
    var displayPsObj = state.displayPsObj = _.indexBy(displayPs, 'item.PID')
    var selectedPIDs = state.selectedPIDs = _.pick(state.selectedPIDs, (checked, pid) => checked && pid in displayPsObj)
    var foldedPIDs = state.foldedPIDs = _.pick(state.foldedPIDs, (folded, pid) => folded && pid in displayPsObj)

    displayPs.forEach(dp => {
      var parents = dp.parents = []
      var node = dp
      while (node.item.PPID in displayPsObj) parents.unshift(node = displayPsObj[node.item.PPID])
    })

    // now we filter and sort a complete displayPs
    var visiblePIDs = state.visiblePIDs = {}
    displayPs = displayPs.filter(dp => {
      var isVisible = [dp].concat(state.treeView ? dp.parents : []).some(dpAncestor => (
        _.some(dpAncestor.item, val => (
          val.toString().toLowerCase().indexOf(state.filter.toLowerCase()) !== -1
        )) &&
        (!state.showSelectedOnly || selectedPIDs[dpAncestor.item.PID])
      )) &&
      (!state.treeView || dp.parents.every(parent => !foldedPIDs[parent.item.PID]))
      if (isVisible) visiblePIDs[dp.item.PID] = true
      return isVisible
    })

    if (!state.treeView) displayPs.sort((dpA, dpB) => {
      var aVal = dpA.item[sort.columnKey]
      var bVal = dpB.item[sort.columnKey]
      var cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal)
        : Math.sign(aVal - bVal)
      return cmp * (sort.sortDir === SortHeaderCell.SortTypes.DESC ? 1 : -1)
    })

    state.displayPs = displayPs
    // end displayPs computation

    var selectedPsCount = _.size(selectedPIDs)
    if (!selectedPsCount) state.showSelectedOnly = false
    this.refs.selectAll.indeterminate = selectedPsCount && selectedPsCount !== state.ps.length
    localStorage.processList = JSON.stringify(_.pick(state, props.stateFilterKeys))
  },
  componentWillUnmount () {
    clearTimeout(this.state.psTimeoutRef)
    $(window).off('resize', this.onResize)
  },
  pollPS () {
    $.get('/api/ps')
      .done(ps => { this.setState({ps}) })
      .fail(this.handleJQueryAjaxFail)
    this.state.psTimeoutRef = setTimeout(this.pollPS, +this.state.psInterval)
  },
  kill (pids) {
    $.post(`/api/kill/${pids.join(',')}`)
      .done(success => {
        if (!success) throw new Error("Something went wrong")
        this.context.app.alertFromError({className: 'alert-success', message: `killed ${pids.length} process${pids.length === 1 ? "" : "es"}`})
      })
      .fail(this.handleJQueryAjaxFail)
  },
  handleJQueryAjaxFail (err) {
    this.context.app.alertFromError(_.merge(err, {message: err.message || "Failed to fetch"}))
  },

  sumSelected (columnKey, asType) {
    var state = this.state
    var selectedPIDs = state.selectedPIDs
    var _vals = _(selectedPIDs)
      .keys()
      .map(pid => state.displayPsObj[pid].item)
      .pluck(columnKey)
    if (!asType) asType = typeof _vals.first()
    switch (asType) {
      case 'number': return _vals.sum().toFixed(1)
      case 'string': return _vals.unique().join(", ")
      default: throw new Error(`invalid column value type '${asType}'`)
    }
  },

  toggleAllPs () {
    this.setState({selectedPIDs: arrayToObjectKeys(_.pluck(this.state.ps, 'PID'), !_.size(this.state.selectedPIDs))})
  },
  toggleP (rowIndex) {
    var state = this.state
    var selectedPIDs = state.selectedPIDs
    var pid = state.displayPs[rowIndex].item.PID
    _.set(selectedPIDs, pid, !selectedPIDs[pid])
    this.setState({selectedPIDs})
  },
  toggleFullCommand () {
    this.setState({fullCommand: !this.state.fullCommand})
  },
  toggleTreeView () {
    this.setState({treeView: !this.state.treeView})
  },
  toggleShowSelectedOnly () {
    this.setState({showSelectedOnly: !this.state.showSelectedOnly})
  },
  unfoldAll () {
    this.setState({foldedPIDs: {}})
  },
  setFilter (evt) {
    this.setState({filter: evt.target.value})
  },
  onSortChange (columnKey, sortDir) {
    this.setState({sort: {columnKey, sortDir}, treeView: false})
  },
  onResize () {
    this.setState({
      tableWidth: this.refs.tableContainer.clientWidth,
      tableMaxHeight: window.innerHeight - $(this.refs.tableContainer).offset().top - this.state.tableMarginBottom
    })
  },

  onHoverTreeLevel (dp, hover) {
    if (!dp.children.length) return
    this.setState({hoverPID: hover ? dp.item.PID : null})
  },
  toggleTreeLevelExpanded (dp) {
    if (!dp.children.length) return
    var foldedPIDs = this.state.foldedPIDs
    var pid = dp.item.PID
    _.set(foldedPIDs, pid, !foldedPIDs[pid])
    this.setState({foldedPIDs})
  },
  renderTreeLevel ({dp, children, ...props}) {
    var hovering = [dp].concat(dp.parents).some(dp => dp.item.PID === this.state.hoverPID)
    return (
      <span {...props}
        onMouseOver={this.onHoverTreeLevel.bind(this, dp, true)}
        onMouseLeave={this.onHoverTreeLevel.bind(this, dp, false)}
        onClick={this.toggleTreeLevelExpanded.bind(this, dp)}
        className={hovering ? 'text-muted' : ''}>
        {children}
      </span>
    )
  },

  renderSortableHeaderCell ({columnKey, children, ...props}) {
    var state = this.state
    var sort = state.sort
    var selectedPIDs = state.selectedPIDs
    return (
      <HeaderCell {...props} columnKey={columnKey}>
        <SortHeaderCell {...props}
          columnKey={columnKey}
          sortDir={!state.treeView && sort.columnKey === columnKey && sort.sortDir}
          onSortChange={this.onSortChange}>
          {children || columnKey}
        </SortHeaderCell>
      </HeaderCell>
    )
  },
  renderBodyCell ({columnKey, rowIndex, children, ...props}) {
    return (
      <Cell {...props}
        className={`column-${columnKey}-body-cell`}>
        {children || this.state.displayPs[rowIndex].item[columnKey]}
      </Cell>
    )
  },
  renderActionsCell ({pids=[], ...props}) {
    const BodyCell = this.renderBodyCell
    return (
      <BodyCell {...props}>
        <div className="btn-group" role="group" aria-label="...">
          <button title="Kill" type="button" className="btn btn-danger btn-xs" onClick={this.kill.bind(this, pids)} data-toggle="tooltip">
            <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </button>
        </div>
      </BodyCell>
    )
  },
  renderSumFooterCell ({asType, ...props}) {
    return (
      <Cell {...props}>{this.sumSelected(props.columnKey, asType)}</Cell>
    )
  },
  render () {
    var state = this.state
    var ps = state.ps
    var foldedPIDs = state.foldedPIDs
    var selectedPIDs = state.selectedPIDs
    var selectedPsCount = _.size(selectedPIDs)
    var displayPs = state.displayPs
    const BodyCell = this.renderBodyCell
    const SortableHeaderCell = this.renderSortableHeaderCell
    const ActionsCell = this.renderActionsCell
    const SumFooterCell = this.renderSumFooterCell
    return (
      <div ref="root">
        <div className="clearfix media-heading">
          <div className="btn-group pull-left" role="group" aria-label="...">{[].concat([
            <button title="Show full command" type="button" className={`btn btn-primary ${state.fullCommand ? 'active' : ''}`} onClick={this.toggleFullCommand} data-toggle="tooltip" key="btn-group-1">
              <span className="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
            </button>
          ]).concat([
            <button title="Tree view" type="button" className={`btn btn-success ${state.treeView ? 'active' : ''}`} onClick={this.toggleTreeView} data-toggle="tooltip" key="btn-group-2">
              <span className="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span>
            </button>
          ]).concat(_.isEmpty(foldedPIDs) ? [] : [
            <button title="Unfold all processes" type="button" className="btn btn-default" onClick={this.unfoldAll} data-toggle="tooltip" key="btn-group-3">
              <span className="glyphicon glyphicon-collapse-down" aria-hidden="true"></span>
            </button>
          ]).concat(!selectedPsCount ? [] : [
            <button title={`Only show ${selectedPsCount} currently selected`} type="button" className={`btn btn-warning ${state.showSelectedOnly ? 'active' : ''}`} onClick={this.toggleShowSelectedOnly} data-toggle="tooltip" key="btn-group-4">
              <span className="glyphicon glyphicon-check" aria-hidden="true"></span>
            </button>
          ])}</div>
          <div className="input-group col-xs-4 pull-right">
            <span className="input-group-addon"><span className="glyphicon glyphicon-search" aria-hidden="true"></span></span>
            <input placeholder="Filter processes..." type="text" className="form-control" value={state.filter} onChange={this.setFilter} aria-label="Filter processes" />
          </div>
        </div>
        <div ref="tableContainer">
          <Table
            width={state.tableWidth}
            maxHeight={state.tableMaxHeight}
            headerHeight={50}
            footerHeight={_.isEmpty(selectedPIDs) ? 0 : 50}
            rowsCount={displayPs.length}
            rowHeight={36 /* FIXME: duplicated in ../less/tables.less */}>
            <Column
              fixed={true}
              columnKey="✓"
              header={<HeaderCell className="column-✓-body-cell"><input type="checkbox" ref="selectAll" checked={selectedPsCount === ps.length} onChange={this.toggleAllPs} /></HeaderCell>}
              cell={props => (
                <BodyCell {...props}>
                  <input type="checkbox" checked={selectedPIDs[displayPs[props.rowIndex].item.PID]} onChange={this.toggleP.bind(this, props.rowIndex)} />
                </BodyCell>
              )}
              width={28} />
            <Column
              fixed={true}
              columnKey="Actions"
              header={HeaderCell}
              cell={props => (
                <ActionsCell {...props} pids={[displayPs[props.rowIndex].item.PID]} />
              )}
              footer={props => (
                <ActionsCell {...props} pids={Object.keys(selectedPIDs)} />
              )}
              width={100} />
            <Column
              columnKey="%CPU"
              header={SortableHeaderCell}
              cell={BodyCell}
              footer={SumFooterCell}
              width={100} />
            <Column
              columnKey="%MEM"
              header={SortableHeaderCell}
              cell={BodyCell}
              footer={SumFooterCell}
              width={100} />
            <Column
              columnKey="USER"
              header={SortableHeaderCell}
              cell={BodyCell}
              footer={SumFooterCell}
              width={100} />
            <Column
              columnKey="PID"
              header={SortableHeaderCell}
              cell={BodyCell}
              footer={props => (
                <SumFooterCell {...props} asType="string" />
              )}
              width={100} />
            {state.treeView
              ? (
                <Column
                  columnKey="Tree"
                  header={HeaderCell}
                  cell={props => {
                    const TreeLevel = this.renderTreeLevel
                    var dp = displayPs[props.rowIndex]
                    return (
                      <BodyCell {...props}>
                        {dp.parents.map((parent, i) => {
                          var parentLastChildPID = _.last(parent.children).item.PID
                          var isLastParent = i === dp.parents.length - 1
                          var isNextParentLastChild = !isLastParent && parentLastChildPID === dp.parents[i + 1].item.PID
                          if (!state.visiblePIDs[parent.item.PID]) return
                          if (isNextParentLastChild) return <span key={i}> </span>
                          return (
                            <TreeLevel dp={parent} title={parent.item.PID} data-toggle="tooltip" key={i}>
                              {isLastParent
                                ? parentLastChildPID === dp.item.PID
                                  ? dp.children.length
                                    ? '┗'
                                    : '┖'
                                  : dp.children.length
                                    ? '┣'
                                    : '┠'
                                : '┃'}
                            </TreeLevel>
                          )
                        })}
                        <TreeLevel dp={dp}>
                          {dp.children.length
                            ? foldedPIDs[dp.item.PID]
                              ? '┭'
                              : '┱'
                            : ''}
                          ╴
                        </TreeLevel>
                      </BodyCell>
                    )
                  }}
                  width={100} />
              )
              : (
                <Column
                  columnKey="PPID"
                  header={HeaderCell}
                  cell={props => (
                    <BodyCell {...props}>
                      {_.pluck(displayPs[props.rowIndex].parents, 'item.PID').join(", ")}
                    </BodyCell>
                  )}
                  width={100} />
              )
            }
            <Column
              columnKey="Command"
              header={HeaderCell}
              cell={props => {
                var comm = displayPs[props.rowIndex].item.COMM || ''
                var cmd = _.last(comm.split(path.sep))
                var cmdPath = comm.slice(0, -cmd.length)
                return (
                  <BodyCell {...props}>
                    {state.fullCommand ? cmdPath : ''}
                    {state.fullCommand ? <b>{cmd}</b> : cmd}
                  </BodyCell>
                )
              }}
              flexGrow={1}
              width={350} />
            <Column
              columnKey="Arguments"
              header={HeaderCell}
              cell={props => {
                var p = displayPs[props.rowIndex].item
                var args = (p.ARGS || '').slice((p.COMM || '').length + 1)
                return (
                  <BodyCell {...props}>
                    {args && <code>{args}</code>}
                  </BodyCell>
                )
              }}
              width={150} />
          </Table>
        </div>
      </div>
    )
  }
})
