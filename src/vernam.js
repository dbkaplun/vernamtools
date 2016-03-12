import _ from 'lodash'

import {strGroup, stringifyArguments} from './util'

const vernam = (input, key, keyLength=key.length) => {
  let output = new Buffer(input)
  key = new Buffer(key)
  for (let i = 0; i < output.length; i++) output[i] ^= key[i % keyLength] // if key's index is greater than its length, x ^ undefined = x
  return output.toString()
}

export default vernam

export const knownPlaintext = _.memoize((cipher, keyLength, plains, filter=_.constant(true)) => (
  plains.reduce((keyTemplates, plain) => {
    let plainLength = plain.length
    let offsetRange = cipher.length - plainLength
    return keyTemplates.reduce((keyTemplates, keyTemplate) => {
      // each keyTemplate is a sparse array whose set values are known characters
      _.times(offsetRange, offset => {
        let inverse = vernam(cipher.slice(offset, offset+Math.min(plainLength, keyLength)), plain)

        try {
          if (offset < keyLength && !isCyclic(inverse, keyLength)) throw _.merge(new Error("vernam(plain, cipher) must be cyclic"), {code: 'NONCYCLIC'})

          let newKeyTemplate = _.reduce(inverse, (tpl, c, i) => {
            i = (i+offset)%keyLength // rotate index
            if (_.get(tpl, i, c) !== c) throw _.merge(new Error("key template and inverse do not match"), {code: 'OVERWRITE'})
            tpl[i] = c
            return tpl
          }, keyTemplate.slice())

          let testKey = fillSparse(newKeyTemplate, '\0')
          let testOutput = vernam(cipher, testKey)
          if (testOutput.indexOf(plain) === -1 || !filter(newKeyTemplate, testOutput)) return

          keyTemplates.push(newKeyTemplate)
        } catch (e) {
          if (!_.includes(['OVERWRITE', 'NONCYCLIC'], e.code)) throw e
        }
      })
      return keyTemplates
    }, [])
  }, [new Array(keyLength)])
), stringifyArguments)

export const fillSparse = (xs, val) => {
  if (typeof val !== 'function') val = _.constant(val)
  return _.reduce(xs, (filled, x, i) => filled + (i in xs ? x : val(i)), '')
}

export const isCyclic = _.memoize((str, len) => str.length < len || str === _.padEnd('', len, str.slice(0, len)), stringifyArguments)

// Port of parts of xortool
export const getKeyLengthFitnesses = _.memoize((text, keyLengthMax) => {
  /*
   * Calc. fitnesses for each keylen
   */
  keyLengthMax += 1
  let fitnesses = _.times(keyLengthMax, keyLength => {
    let fitness = countEquals(text, keyLength)
    return fitness / (keyLengthMax + Math.pow(keyLength, 1.5)) // smaller key-length with nearly the same fitness is preferable
  })
  return _(fitnesses)
    .flatMap((fitness, keyLength) => (
      // local maximum
      fitness > _.get(fitnesses, keyLength+1, -Infinity) &&
      fitness > _.get(fitnesses, keyLength-1, -Infinity)
        ? [{fitness, keyLength}]
        : []
    ))
    .sortBy(fitnesses, ({fitness}) => -fitness)
    .value()
}, stringifyArguments)

export const guessDivisors = fitnesses => {
  /*
   * Returns common divisors
   */
  let divisorCounts = {}

  fitnesses.forEach(({fitness, keyLength}) => {
    _(_.range(2, keyLength+1))
      .filter(n => keyLength % n === 0)
      .forEach(n => { _.set(divisorCounts, n, _.get(divisorCounts, n, 0) + fitness) })
  })

  return _(divisorCounts)
    .map((c, n) => ({c, n}))
    .sortBy(({c, n}) => -c)
    .map('n')
    .map(Number)
    .value()
}

export const countEquals = _.memoize((text, keyLength) => {
  /*
   * count equal chars count for each offset and sum them
   */
  if (keyLength >= text.length) return 0
  return _.sumBy(strGroup(text, keyLength), cs => (_(cs).countBy().values().max() || 0) - 1)
}, stringifyArguments)
