import test from 'ava'
import _ from 'lodash'

import {group} from '../src/arrayOps'

let mockUngrouped = "Hello, world!"
let mockGroupSize = 4
let mockGrouped = ["Hoo!", "e,r", "l l", "lwd"].map(g => g.split(''))
test(`group(${JSON.stringify(mockUngrouped)}, ${mockGroupSize}) === ${JSON.stringify(mockGrouped)}`, t => {
  t.same(group(mockUngrouped, mockGroupSize), mockGrouped)
})
