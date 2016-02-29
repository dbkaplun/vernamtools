import _ from 'lodash'
import mem from 'mem'

import vernam, {knownPlaintext, fillSparse, getKeyLengthFitnesses} from './vernam'
import {strGroup} from './strOps'

const return0 = _.constant(0)
const returnTrue = _.constant(true)

export default class VernamBruteForcer {
  constructor (opts) {
    _.defaults(this, opts, {
      keyLengthMax: 64,
      keyCharValidator: returnTrue,
      keyValidator: returnTrue,
      knownPlaintexts: [],
      outputCharValidator: returnTrue,
      outputValidator: returnTrue
    })
    _.defaults(this, {
      keyLengths: getKeyLengthFitnesses(this.ciphertext, this.keyLengthMax),
      validKeyChars: _.filter(VernamBruteForcer.ALL_CHARS, this.keyCharValidator)
    })
    this.resetGuess()

    ;['getKeyTemplates', 'getValidGuessChars', 'getKeySpaceSize', 'getOptimizedKeySpaceSize'].forEach(prop => {
      this[prop] = _.memoize(this[prop])
    })
  }

  getKeyTemplates (keyLength) {
    let {ciphertext, knownPlaintexts, keyCharValidator, outputCharValidator} = this
    return knownPlaintext(ciphertext, keyLength, knownPlaintexts, (testKeyTemplate, testOutput) => {
      let testOutputGroups = strGroup(testOutput, testKeyTemplate.length)
      return testKeyTemplate.every(function (c, i) { // skips sparse indices
        return keyCharValidator.apply(this, arguments) && outputCharValidator(testOutputGroups[i])
      }.bind(this))
    })
  }

  getValidGuessChars (keyLength) {
    let {ciphertext, validKeyChars, outputCharValidator} = this
    let testKey = _.repeat(_.first(validKeyChars), keyLength)
    return _.times(keyLength, i => (
      _.filter(validKeyChars, c => {
        let testOutput = vernam(ciphertext, `${testKey.slice(0, i)}${c}${testKey.slice(i+1)}`)
        return _
          .range(i, testOutput.length, testKey.length)
          .every(_.flow(_.propertyOf(testOutput), outputCharValidator))
      })
    ))
  }

  getKeySpaceSize (keyLength) {
    return _.reduce(this.getValidGuessChars(keyLength), (product, cs) => product * cs.length, 1)
  }

  getOptimizedKeySpaceSize (keyLength) {
    let validGuessChars = this.getValidGuessChars(keyLength)
    return this.getKeyTemplates(keyLength).reduce((total, keyTemplate) => (
      total + _.reduce(validGuessChars, (product, cs, i) => (
        product * (i in keyTemplate ? 1 : cs.length)
      ), 1)
    ), 0)
  }

  getAttemptedKeySpaceSize (keyLength) {
    return _.get(this.state.attemptsPerKeyLength, keyLength, 0)
  }

  resetGuess () {
    this.state = {
      keyLengthIndex: 0,
      keyTemplateIndex: 0,
      guess: null,

      attemptsPerKeyLength: {}
    }
  }

  nextGuess () {
    let {state, keyLengths, keyValidator} = this
    let {guess, keyTemplateIndex, keyLengthIndex, attemptsPerKeyLength} = state
    if (keyLengthIndex >= keyLengths.length) throw _.merge(new Error("keyspace exhausted"), {code: 'KEYSPACE_EXHAUSTED'})
    let {keyLength} = keyLengths[keyLengthIndex]
    let validGuessChars = this.getValidGuessChars(keyLength)
    let keyTemplates = this.getKeyTemplates(keyLength)
    let keyTemplate = keyTemplates[keyTemplateIndex]

    attemptsPerKeyLength[keyLength] = this.getAttemptedKeySpaceSize(keyLength) + 1

    if (!guess && keyTemplate) guess = _.map(keyTemplate, return0)
    else {
      // perform increment with carry on guess
      let j = _.findIndex(guess, (c, i) => !(i in keyTemplate) && c < validGuessChars[i].length - 1)
      if (j !== -1) {
        // increment
        guess = [..._.times(j, return0), guess[j]+1, ...guess.slice(j+1)]
      } else {
        // carry
        state.guess = null
        state.keyTemplateIndex++
        if (state.keyTemplateIndex >= keyTemplates.length) {
          state.keyTemplateIndex = 0
          state.keyLengthIndex++
        }
        return this.nextGuess()
      }
    }

    state.guess = guess
    let key = fillSparse(keyTemplate, i => validGuessChars[i][guess[i]])
    if (!keyValidator(key)) return this.nextGuess()
    return key
  }
}
VernamBruteForcer.ALL_CHARS = _.times(0xFF+1, String.fromCharCode)
