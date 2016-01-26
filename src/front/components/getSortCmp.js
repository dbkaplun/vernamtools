import _ from 'lodash'

import SortHeader from './SortHeader.jsx'

export default (sort, type) => (a, b) => {
  var aVal = _.get(a, sort.columnKey)
  var bVal = _.get(b, sort.columnKey)
  var cmp = type === 'number'
    ? Math.sign((Number(aVal) || 0) - (Number(bVal) || 0))
    : (aVal || '').toString().localeCompare(bVal || '')
  return cmp * (sort.sortDir === SortHeader.SortTypes.DESC ? 1 : -1)
}
