import test from 'ava'
import _ from 'lodash'
import {strGroup, strToRe} from '../src/strOps'

let mockUngrouped = "Hello, world!"
let mockGroupSize = 4
let mockGrouped = ["Hoo!", "e,r", "l l", "lwd"]
test(`strGroup(${JSON.stringify(mockUngrouped)}, ${mockGroupSize}) === ${JSON.stringify(mockGrouped)}`, t => {
  t.same(strGroup(mockUngrouped, mockGroupSize), mockGrouped)
})

let mockReStr = '/^[A-Za-z0-9!?.,]+$/'
test(`strToRe(${JSON.stringify(mockReStr)}) === ${mockReStr}`, t => {
  let reStrRe = strToRe(mockReStr)
  t.ok(reStrRe instanceof RegExp)
  t.ok(reStrRe.source, mockReStr.replace(/(^\/)|(\/$)/g, ''))
  // t.ok(reStrRe.flags, mockReStr.replace(/^.*\//, ''))
})

let mockInvalidReStr = 'this is not a regexp'
test(`strToRe(${JSON.stringify(mockInvalidReStr)}) throws an error`, t => {
  t.throws(() => { strToRe(mockInvalidReStr) })
})
