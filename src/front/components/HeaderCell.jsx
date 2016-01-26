import React from 'react'
import {Cell} from 'fixed-data-table'

export default ({columnKey, children, ...props}) => (
  <Cell {...props} columnKey={columnKey} className={`column-${columnKey}-header-cell`}>
    {children || columnKey}
  </Cell>
)
