import _ from 'lodash'

export const return0 = _.constant(0)
export const returnTrue = _.constant(true)

export const stringifyArguments = (...args) => JSON.stringify(args)

export const group = (xs, len) => (
  _(xs)
    .map((x, i) => ({x, i}))
    .groupBy(({i}) => i % len)
    .toArray()
    .map(group => _.map(group, 'x'))
    .value()
)

export const strGroup = _.memoize((...args) => (
  group(...args).map(cs => cs.join(''))
), stringifyArguments)

export const strToRe = _.memoize(string => {
  let [, source, flags] = string.match(strToRe.RE_RE)
  return new RegExp(source, flags)
})
strToRe.RE_RE = /^\/(.*)\/(\w*)$/

export const formatNumber = _.memoize((n, locale='en-US', opts={maximumFractionDigits: 0}) => (
  n.toLocaleString(locale, opts)
), stringifyArguments)
