import test from 'ava'
import _ from 'lodash'
import {return0, returnTrue, stringifyArguments, group, strGroup, strToRe} from '../src/util'


test(`return0() === 0`, t => { t.same(return0(), 0) })
test(`returnTrue() === true`, t => { t.same(returnTrue(), true) })

test(`stringifyArguments(1, 2, null) === '[1,2,null]'`, t => {
  t.same(stringifyArguments(1, 2, null), '[1,2,null]')
})

let mockUngrouped = "Hello, world!"
let mockGroupSize = 4
let mockGrouped = ["Hoo!", "e,r", "l l", "lwd"]
let mockGroupedArrs = mockGrouped.map(g => g.split(''))
test(`group(${JSON.stringify(mockUngrouped)}, ${mockGroupSize}) === ${JSON.stringify(mockGroupedArrs)}`, t => {
  t.same(group(mockUngrouped, mockGroupSize), mockGroupedArrs)
})

test(`strGroup(${JSON.stringify(mockUngrouped)}, ${mockGroupSize}) === ${JSON.stringify(mockGrouped)}`, t => {
  t.same(strGroup(mockUngrouped, mockGroupSize), mockGrouped)
})

let mockReStr = '/^[A-Za-z0-9!?.,]+$/'
test(`strToRe(${JSON.stringify(mockReStr)}) === ${mockReStr}`, t => {
  let reStrRe = strToRe(mockReStr)
  t.ok(reStrRe instanceof RegExp)
  t.ok(reStrRe.source, mockReStr.replace(/(^\/)|(\/$)/g, ''))
  // t.ok(reStrRe.flags, mockReStr.replace(/^.*\//g, ''))
})

let mockInvalidReStr = 'this is not a regexp'
test(`strToRe(${JSON.stringify(mockInvalidReStr)}) throws an error`, t => {
  t.throws(() => { strToRe(mockInvalidReStr) })
})
