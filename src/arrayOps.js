import _ from 'lodash'

export const group = (xs, len) => (
  _(xs)
    .map((x, i) => ({x, i}))
    .groupBy(({i}) => i % len)
    .toArray()
    .map(group => _.map(group, 'x'))
    .value()
)
