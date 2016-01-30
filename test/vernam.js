import test from 'ava'
import _ from 'lodash'

import vernam from '../src/vernam'

function assertStrLen (str, len) {
  if (str.length !== len) throw new Error(`${str.length} === ${JSON.stringify(str)}.length !== ${len}`)
}

const repeatUntilSize = (str, len) => _.padEnd('', len, str)
const nullChar = '\0'

let mockInput = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`.trim()
let mockNullString = _.repeat(mockInput.length, nullChar)

let mockKeyLength = 10
let mockNullKey = mockNullString.slice(0, mockKeyLength)
let mockKey = 'V3rnmRulz!'
assertStrLen(mockKey, mockKeyLength)

let mockShortKeyLength = 3
let mockShortKey = 'foo'
assertStrLen(mockShortKey, mockShortKeyLength)

test("vernam is its own inverse: vernam(vernam(input, key), key) === input", t => {
  t.is(vernam(vernam(mockInput, mockKey), mockKey), mockInput)
})

test("vernam is the identity function for null keys: vernam(input, nullStr) === input", t => {
  t.is(vernam(mockInput, mockNullKey), mockInput)
})

test("vernam(nullStr, key) === repeatUntilSize(key, nullStr.length)", t => {
  t.is(vernam(mockNullString, mockKey), repeatUntilSize(mockKey, mockNullString.length))
})

test("vernam(input, key, len) === vernam(input, key.slice(0, len)) if key.length < len", t => {
  t.is(
    vernam(mockInput, mockKey, mockShortKeyLength),
    vernam(mockInput, mockKey.slice(0, mockShortKeyLength)))
})

test("vernam(input, key, len) === vernam(input, padEnd(key, len, nullChar)) if key.length > len", t => {
  t.is(
    vernam(mockInput, mockShortKey, mockKeyLength),
    vernam(mockInput, _.padEnd(mockShortKey, mockKeyLength, nullChar)))
})

test("vernam(input, key).length === input.length", t => {
  t.is(vernam(mockInput, mockKey).length, mockInput.length)
  t.is(vernam(mockKey, mockInput).length, mockKey.length)
})
