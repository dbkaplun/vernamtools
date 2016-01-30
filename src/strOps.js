import mem from 'mem'

import {group} from './arrayOps'

export const strGroup = mem((...args) => group(...args).map(cs => cs.join('')))

export const strToRe = mem(string => {
  let [, source, flags] = string.match(strToRe.RE_RE)
  return new RegExp(source, flags)
})
strToRe.RE_RE = /^\/(.*)\/(\w*)$/
