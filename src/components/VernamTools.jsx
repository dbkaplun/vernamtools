import React from 'react'
import _ from 'lodash'

import vernam, {knownPlaintext, fillSparse, calculateFitnesses, guessDivisors} from '../vernam'
import {strToRe, strGroup} from '../strOps'
import mem from 'mem'

const ALL_CHARS = _.times(0xFF+1, String.fromCharCode)
const DISPLAYABLE_CHARACTERS_RE = /^[^\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]+$/ // all but 0x00-0x08, 0x0b-0x0c, 0x0e-0x1f, 0x7f-0x9f
const DISPLAYABLE_ASCII_CHARACTERS_RE = /^[\u0020-\u007E]+$/
const DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE = `/${DISPLAYABLE_CHARACTERS_RE.source}/`
const DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE = `/${DISPLAYABLE_ASCII_CHARACTERS_RE.source}/`
const QUOTES_ENDS_RE = /(^")|("$)/g

const toDisplayString = mem(string => (
  JSON.stringify(string || '')
    .replace(QUOTES_ENDS_RE, '')
    .replace(/[\u007F-\u009F]/g, c => `\\u${_.padStart(c.charCodeAt(0).toString(16), 4, '0')}`)
))

const fromDisplayString = mem(string => {
  try {
    return JSON.parse(`"${string.replace('\n', '\\n').replace('\r', '\\r')}"`)
  } catch (e) {
    return null
  }
})

const arrayFromDisplayString = mem(string => string.split(/\r|\n/).map(fromDisplayString))

const parseCharValidator = mem(validatorString => {
  // maybe it's a regex
  const validatorRe = _.attempt(strToRe, validatorString)
  if (_.isRegExp(validatorRe)) return mem(c => c.match(validatorRe))

  // otherwise treat as list of allowed chars
  const allowedChars = new Set(fromDisplayString(validatorString) || '')
  return mem(str => _.every(str, c => allowedChars.has(c)))
})

const parseValidator = mem((paramNames, validatorString) => {
  paramNames = [].concat(paramNames) // coerce to Array
  if (validatorString) try {
    let validator = _.merge(mem((...args) => {
      try {
        return validator.fn(...args)
      } catch (e) {
        console.error(e)
      }
      return false
    }), {fn: new Function(paramNames, validatorString)})
    return validator
  } catch (e) {
    console.error(e)
  }
  return null
})


const invalidChars = (string, validator) => {
  return _(string)
    .reject(validator)
    .uniq()
    .value()
}

export default React.createClass({
  getInitialState () {
    return {
      displayInput: toDisplayString([
        '\x2b\x09\x4a\x03\x49\x0f\x0e\x14\x15',
        '\x1a\x00\x10\x3f\x1a\x71\x5c\x5b\x5b',
        '\x00\x1a\x16\x38\x06\x46\x66\x5a\x55',
        '\x30\x0a\x03\x1d\x08\x50\x5f\x51\x15',
        '\x6b\x4f\x19\x56\x00\x54\x1b\x50\x58',
        '\x21\x1a\x0f\x13\x07\x46\x1d\x58\x58',
        '\x21\x0e\x16\x1f\x06\x5c\x1d\x5c\x45',
        '\x27\x09\x4c\x1f\x07\x56\x56\x4c\x78',
        '\x24\x47\x40\x49\x19\x0f\x11\x1d\x17',
        '\x7f\x52\x42\x5b\x58\x1b\x13\x4f\x17',
        '\x26\x00\x01\x03\x04\x57\x5d\x40\x19',
        '\x2e\x00\x01\x17\x1d\x5b\x5c\x5a\x17',
        '\x7f\x4f\x06\x19\x0a\x47\x5e\x51\x59',
        '\x36\x41\x0e\x19\x0a\x53\x47\x5d\x58',
        '\x2c\x41\x0a\x04\x0c\x54\x13\x1f\x17',
        '\x60\x50\x12\x4b\x4b\x12\x18\x14\x42',
        '\x79\x4f\x1f\x56\x14\x12\x56\x58\x44',
        '\x27\x4f\x19\x56\x49\x16\x1b\x16\x14',
        '\x21\x1d\x07\x05\x19\x5d\x5d\x47\x52',
        '\x60\x46\x4c\x1e\x1d\x5f\x5f\x1c\x15',
        '\x7e\x0b\x0b\x00\x49\x51\x5f\x55\x44',
        '\x31\x52\x45\x13\x1b\x40\x5c\x46\x10',
        '\x7c\x38\x10\x19\x07\x55\x13\x44\x56',
        '\x31\x1c\x15\x19\x1b\x56\x13\x47\x58',
        '\x30\x1d\x1b\x58\x55\x1d\x57\x5d\x41',
        '\x7c\x4d\x4b\x4d\x49\x4f'
      ].join('')),
      displayKey: '',
      displayOutputPrefix: '',

      keyTemplateIndex: 0,
      guess: null,
      bruteForceStatus: 'PAUSED',
      bruteForceBatchSize: 50,

      displayKeyLength: '',
      keyLengthMax: 65,
      displayAllowedKeyChars: DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE,
      displayKeyValidator: '',
      displayKnownPlaintexts: 'document',
      displayAllowedOutputChars: DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE,
      displayOutputValidator: '',

      renderThrottle: 200
    }
  },

  componentWillMount () {
    this._render.throttled = _.throttle(this._render, this.state.renderThrottle)
    this.componentWillUpdate(this.props, this.state)
  },

  isPropDifferent (state, props) {
    return (typeof props === 'string'
      ? props.split(/\s+/)
      : prop
    ).some(prop => _.get(state, prop) !== _.get(this.state, prop))
  },

  componentWillUpdate (props, state) {
    const isPropDifferent = this.isPropDifferent.bind(this, state)

    let {keyLengthMax, guess, keyTemplateIndex} = state

    // input is input manually and never changed algorithmically
    let input = state.input = fromDisplayString(state.displayInput)
    let isInputDifferent = isPropDifferent('input')
    state.isInputValid = input !== null

    // key validators
    let keyLength = state.keyLength = Number(state.displayKeyLength)
    let isKeyLengthDifferent = isPropDifferent('keyLength')
    let isAllowedKeyChar = state.isAllowedKeyChar = parseCharValidator(state.displayAllowedKeyChars)
    let isIsAllowedKeyCharDifferent = isPropDifferent('isAllowedKeyChar')
    let keyValidatorFn = state.keyValidatorFn = parseValidator('k', fromDisplayString(state.displayKeyValidator))
    let isKeyValidatorFnDifferent = isPropDifferent('keyValidatorFn')

    // output validators
    let knownPlaintexts = state.knownPlaintexts = arrayFromDisplayString(state.displayKnownPlaintexts)
    let isKnownPlaintextsDifferent = isPropDifferent('knownPlaintexts')
    let isAllowedOutputChar = state.isAllowedOutputChar = parseCharValidator(state.displayAllowedOutputChars)
    let isIsAllowedOutputCharDifferent = isPropDifferent('isAllowedOutputChar')
    let outputValidatorFn = state.outputValidatorFn = parseValidator('p', fromDisplayString(state.displayOutputValidator))
    let isOutputValidatorFnDifferent = isPropDifferent('outputValidatorFn')

    // init brute force
    if (!state.isInputValid) state.keyTemplates = []
    else if (!('keyTemplates' in state) || isInputDifferent || isKeyLengthDifferent || isKnownPlaintextsDifferent) {
      state.keyTemplates = knownPlaintext(input, keyLength, knownPlaintexts, (testKeyTemplate, testOutput) => {
        let testOutputGroups = strGroup(testOutput, testKeyTemplate.length)
        return testKeyTemplate.every((c, i) => ( // skips sparse indices
          isAllowedKeyChar(c) && isAllowedOutputChar(testOutputGroups[i])
        ))
      })
    }
    let keyTemplate = state.keyTemplates[keyTemplateIndex]
    let isKeyTemplateDifferent = isPropDifferent('keyTemplates keyTemplateIndex')

    if (!('validKeyChars' in state) || isIsAllowedKeyCharDifferent) {
      state.validKeyChars = _.filter(ALL_CHARS, isAllowedKeyChar)
    }
    if (!('validGuessChars' in state) || isKeyTemplateDifferent || isPropDifferent('validKeyChars')) {
      let testKey = fillSparse(keyTemplate, _.first(state.validKeyChars))
      state.validGuessChars = _.flatMap(keyTemplate, (c,i) => (
        i in keyTemplate
          ? []
          : [_.filter(state.validKeyChars, c => {
              let testOutput = vernam(input, `${testKey.slice(0, i)}${c}${testKey.slice(i+1)}`)
              return _
                .range(i, testOutput.length, testKey.length)
                .every(_.flow(_.propertyOf(testOutput), isAllowedOutputChar))
            })]
      ))
    }

    // COMPUTE KEY
    let outputPrefix = state.outputPrefix = fromDisplayString(state.displayOutputPrefix)
    let isOutputPrefixDifferent = isPropDifferent('outputPrefix')

    let useGuess = guess !== null && isPropDifferent('guess')
    if (isOutputPrefixDifferent || useGuess) {
      // compute
      state.key = isOutputPrefixDifferent
        ? vernam(input.slice(0, outputPrefix.length), outputPrefix)
        : fillSparse(keyTemplate, i => state.validGuessChars[i][guess[i]])
      state.displayKey = toDisplayString(state.key)
    } else {
      // use key from input
      state.key = fromDisplayString(state.displayKey)
    }
    let key = state.key
    let isKeyDifferent = isPropDifferent('key')
    // KEY FINALIZED

    // COMPUTE OUTPUT
    if (!('output' in state) || isInputDifferent || isKeyDifferent) {
      // generate everything from key
      state.output = vernam(input, key)
      outputPrefix = state.outputPrefix = state.output.slice(0, key.length)
      state.displayOutputPrefix = toDisplayString(outputPrefix)
    }
    let output = state.output
    let isOutputDifferent = isPropDifferent('output')
    // OUTPUT FINALIZED

    // determine key validity
    if (!('invalidKeyChars' in state) || isKeyDifferent || isIsAllowedKeyCharDifferent) {
      state.invalidKeyChars = invalidChars(key, isAllowedKeyChar)
    }
    if (!('keyPassesValidator' in state) || isKeyDifferent || isKeyValidatorFnDifferent) {
      state.keyPassesValidator = !keyValidatorFn || keyValidatorFn(key)
    }

    // determine output validity
    if (!('invalidOutputPrefixChars' in state) || isIsAllowedOutputCharDifferent || isPropDifferent('outputPrefix')) {
      state.invalidOutputPrefixChars = invalidChars(outputPrefix, isAllowedOutputChar)
    }
    if (!('invalidOutputChars' in state) || isOutputDifferent || isIsAllowedOutputCharDifferent) {
      state.invalidOutputChars = invalidChars(output, isAllowedOutputChar)
    }
    if (!('missingPlaintexts' in state) || isOutputDifferent || isKnownPlaintextsDifferent) {
      state.missingPlaintexts = knownPlaintexts.filter(plain => plain !== null && output.indexOf(plain) === -1)
    }
    if (!('outputPassesValidator' in state) || isOutputDifferent || isOutputValidatorFnDifferent) {
      state.outputPassesValidator = !outputValidatorFn || outputValidatorFn(output)
    }

    // determine is*Valid properties
    state.isKeyLengthValid = !keyLength || key.length === keyLength
    state.isKeyValid = key !== null && state.isKeyLengthValid && !state.invalidKeyChars.length && state.keyPassesValidator
    state.isOutputValid = !state.missingPlaintexts.length && !state.invalidOutputChars.length && state.outputPassesValidator
    state.isVernamValid = state.isKeyValid && state.isOutputValid

    // conditionally pause brute force
    if (isInputDifferent ||
      isKeyLengthDifferent || isIsAllowedKeyCharDifferent || isKeyValidatorFnDifferent ||
      isKnownPlaintextsDifferent || isIsAllowedOutputCharDifferent || isOutputValidatorFnDifferent ||
      (state.bruteForceStatus === 'KEYSPACE_EXHAUSTED' && (isKeyDifferent || isKeyTemplateDifferent))) {
      state.guess = null
      state.keyTemplateIndex = 0
      state.bruteForceStatus = 'PAUSED'
    }

    // useful but otherwise unnecessary displayable values
    if (!('pastValidOutputs' in state) || isInputDifferent) state.pastValidOutputs = []
    if (state.isVernamValid && (isKeyDifferent || isOutputDifferent || isPropDifferent('isVernamValid'))) {
      this.setState({pastValidOutputs: [{key, output}, ...state.pastValidOutputs.slice(0, 50)]})
    }

    state.keyLengthFitnesses = state.isInputValid ? calculateFitnesses(input, keyLengthMax) : []
    if (!('keyLengthDivisorGuesses' in state) || isPropDifferent('keyLengthFitnesses')) {
      state.keyLengthDivisorGuesses = guessDivisors(state.keyLengthFitnesses, keyLengthMax)
    }
  },

  // Brute force
  nextGuess () {
    let state, {keyTemplates, keyTemplateIndex, guess, validGuessChars} = state = this.state
    let keyTemplate = keyTemplates[keyTemplateIndex]

    if (!keyTemplate) this.setState({bruteForceStatus: 'KEYSPACE_EXHAUSTED'})
    else if (guess === null) {
      guess = _.flatMap(keyTemplate, (c, i) => i in keyTemplate ? [] : [0])
    } else {
      // increment
      let j = _.findIndex(guess, (c, i) => c < validGuessChars[i].length - 1)
      if (j === -1) {
        state.keyTemplateIndex++
        state.guess = null
        this.setState(state)
        return this.nextGuess()
      }
      guess = [..._.times(j, _.constant(0)), guess[j]+1, ...guess.slice(j+1)]
    }

    return guess
  },

  bruteForce (fn) {
    if (fn() !== false) this.setState({guess: this.nextGuess()}, () => { // wait for state to apply
      requestAnimationFrame(() => { this.bruteForce(fn) })
    })
  },
  bruteForceUpdate (fn) {
    let bruteForceIndex = 0
    let bruteForceStatus = 'ACTIVE'
    this.setState({bruteForceStatus, bruteForceIndex}, () => {
      this.bruteForce(() => {
        bruteForceStatus = this.state.bruteForceStatus
        let wasActive = bruteForceStatus === 'ACTIVE'
        let ret = wasActive && fn()
        if (ret) ++bruteForceIndex
        else if (wasActive) bruteForceStatus = 'PAUSED'
        this.setState({bruteForceStatus, bruteForceIndex})
        return ret
      })
    })
  },
  bruteForceBatch (count=this.state.bruteForceBatchSize) {
    this.bruteForceUpdate(() => this.state.bruteForceIndex < count)
  },
  toggleBruteForce () {
    if (this.state.bruteForceStatus === 'ACTIVE') this.setState({bruteForceStatus: 'PAUSING'})
    else this.bruteForceUpdate(_.constant(true))
  },

  onChange (evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  _render () {
    const {
      // input
      input, displayInput,
      key, displayKey,
      outputPrefix, displayOutputPrefix,
      isInputValid,

      // output
      output,

      // brute force
      bruteForceStatus, bruteForceIndex, bruteForceBatchSize, pastValidOutputs,

      // key validators
      isKeyLengthValid, isKeyValid,
      keyLength, displayKeyLength,
      keyLengthMax,
      displayAllowedKeyChars, invalidKeyChars,
      displayKeyValidator, keyValidatorFn, keyPassesValidator,
      keyLengthFitnesses, keyLengthDivisorGuesses,

      // output validators
      isOutputValid,
      knownPlaintexts, displayKnownPlaintexts,
      missingPlaintexts,
      isAllowedOutputChar, displayAllowedOutputChars,
      invalidOutputChars, invalidOutputPrefixChars,
      displayOutputValidator, outputValidatorFn, outputPassesValidator
    } = this.state

    let canBruteForce = keyLength && isInputValid

    return (
      <form className="form-horizontal container" role="form">
        <h1 className="clearfix">
          vernamtools
          {' '}
          <small>code, ★ on <a href="https://github.com/dbkaplun/vernamtools" target="_blank">Github</a></small>
        </h1>
        <p className="text-muted">NOTE: JSON strings are used everywhere, so make sure to escape your data.</p>
        <div className="row">
          <div className="col-sm-6">
            <div className={`form-group ${isKeyValid ? '' : 'has-error'}`}>
              <label htmlFor="key" className="col-sm-3 control-label">Key</label>
              <div className="col-sm-9">
                <input id="key" name="displayKey" value={displayKey} onChange={this.onChange} placeholder={canBruteForce ? "Ready to brute force..." : ''} className="form-control" />
                <p className={`help-block ${!isKeyLengthValid ? '' : 'hide'}`}>
                  Key must be <strong>{keyLength}</strong> character(s) long.
                </p>
                <p className={`help-block ${invalidKeyChars.length ? '' : 'hide'}`}>
                  Disallowed characters: {invalidKeyChars.map((c, i) => (
                    <span key={i}>
                      {i ? ", " : ''}<code>{toDisplayString(c)}</code>
                    </span>
                  ))}
                </p>
                <p className={`help-block ${!keyPassesValidator ? '' : 'hide'}`}>
                  Validator failed this key.
                </p>
              </div>
            </div>
            <div className={`form-group ${isInputValid ? '' : 'has-error'}`}>
              <label htmlFor="input" className="col-sm-3 control-label">Input</label>
              <div className="col-sm-9">
                <textarea id="input" name="displayInput" value={displayInput} onChange={this.onChange} rows="5" className="form-control" autofocus />
              </div>
            </div>
            <div className={`form-group ${canBruteForce && bruteForceStatus !== 'KEYSPACE_EXHAUSTED' ? '' : 'has-error'}`}>
              <div className="col-sm-9 col-sm-offset-3">
                <div>
                  <span className="btn-group">
                    <button onClick={()=>{this.toggleBruteForce()}} title="Brute force" disabled={!canBruteForce} className={`btn btn-primary ${bruteForceStatus === 'ACTIVE' ? 'active' : ''}`} data-toggle="tooltip" type="button">
                      <span className={`glyphicon ${bruteForceStatus === 'ACTIVE' ? 'glyphicon-pause' : 'glyphicon-play'}`}></span>
                    </button>
                    <button onClick={()=>{this.bruteForceBatch(1)}} title="Next guess" disabled={!canBruteForce} className="btn btn-default" data-toggle="tooltip" type="button">
                      <span className="glyphicon glyphicon-step-forward"></span>
                    </button>
                    <button onClick={()=>{this.bruteForceBatch()}} title={`Take ${bruteForceBatchSize} guesses`} disabled={!canBruteForce} className="btn btn-success" data-toggle="tooltip" type="button">
                      <span className="glyphicon glyphicon-fast-forward"></span>
                    </button>
                  </span>
                </div>
                <p className="text-muted">NOTE: for increased performance, use validations to reduce search space.</p>
                <p className={`help-block ${bruteForceStatus === 'KEYSPACE_EXHAUSTED' ? '' : 'hide'}`}>Keyspace exhausted for this key length.</p>
                <p className={`help-block ${!keyLength ? '' : 'hide'}`}>You must select a key length in order to perform a brute force search.</p>
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className={`form-group ${outputPrefix !== null && !invalidOutputPrefixChars.length ? '' : 'has-error'}`}>
              <label htmlFor="output-prefix" className="col-sm-3 control-label">Output prefix</label>
              <div className="col-sm-9">
                <input id="output-prefix" name="displayOutputPrefix" value={displayOutputPrefix} onChange={this.onChange} className="form-control" />
                <p className={`help-block ${invalidOutputPrefixChars.length ? '' : 'hide'}`}>
                  Disallowed characters: {invalidOutputPrefixChars.map((c, i) => (
                    <span key={i}>
                      {i ? ", " : ''}<code>{toDisplayString(c)}</code>
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className={`form-group ${isOutputValid ? '' : 'has-error'}`}>
              <ul id="output-tabs" className="nav nav-tabs" role="tablist">
                <li className="active"><a href="#output-tabs-output" role="tab" data-toggle="tab">Output</a></li>
                <li className={key && output ? '' : 'hide'}><a href="#output-tabs-groups" role="tab" data-toggle="tab">Character groups</a></li>
                <li className={pastValidOutputs.length ? '' : 'hide'}><a href="#output-tabs-past-valid-outputs" role="tab" data-toggle="tab">Past valid outputs</a></li>
              </ul>
              <div className="tab-content">
                <div id="output-tabs-output" className="tab-pane active">
                  <textarea value={toDisplayString(output)} readOnly={true} rows="5" className="form-control" />
                </div>
                <div id="output-tabs-groups" className={`tab-pane ${key && output ? '' : 'hide'}`}>
                  <textarea value={`
${key}

${_(output)
  .chunk(key.length)
  .invokeMap('join', '')
  .join('\n')}
                  `.trim()} readOnly={true} rows="20" className="form-control" />
                </div>
                <div id="output-tabs-past-valid-outputs" className={`tab-pane ${pastValidOutputs ? '' : 'hide'}`}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Key</th>
                        <th>Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastValidOutputs.map(({key, output}, i) => {
                        let displayKey = toDisplayString(key)
                        return (
                          <tr key={i}>
                            <td>{i}</td>
                            <td><a onClick={evt=>{evt.preventDefault();this.setState({displayKey})}} href=""><code>{displayKey}</code></a></td>
                            <td><code>{_.truncate(toDisplayString(output))}</code></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={`help-block ${isInputValid && missingPlaintexts.length ? '' : 'hide'}`}>
                <p>Output must contain the following, but does not:</p>
                <ul>
                  {missingPlaintexts.map((p, i) => (
                    <li key={i}><code>{toDisplayString(p)}</code></li>
                  ))}
                </ul>
              </div>
              <p className={`help-block ${isInputValid && invalidOutputChars.length ? '' : 'hide'}`}>
                Disallowed characters:
                {invalidOutputChars.map((c, i) => (
                  <span key={i}>
                    {i ? ", " : ''}<code>{toDisplayString(c)}</code>
                  </span>
                ))}
              </p>
              <p className={`help-block ${isInputValid && !outputPassesValidator ? '' : 'hide'}`}>
                Validator failed this output.
              </p>
              <p className={`help-block ${!isInputValid ? '' : 'hide'}`}>
                Input is not escaped properly.
              </p>
            </div>
          </div>
        </div>

        <div className="page-header"><h3>Validations</h3></div>
        <div className="row">
          <div className="col-sm-6">
            <h4>Key</h4>
            <div className={`form-group ${keyLength === keyLength /* isNaN(keyLength) */ ? '' : 'has-error'}`}>
              <label htmlFor="key-length" className="col-sm-2 control-label">Length</label>
              <div className="col-sm-10">
                <input id="key-length" name="displayKeyLength" value={displayKeyLength} onChange={this.onChange} type="number" min="0" max={keyLengthMax} className="form-control" />
                <p className="help-block">
                  <span className={keyLengthDivisorGuesses.length ? '' : 'hide'}>
                    Likely divisible by {keyLengthDivisorGuesses[0]}.
                  </span>
                  {' '}
                  {_.attempt(() => {
                    if (!keyLengthFitnesses.length) return ''
                    let {keyLength} = _.first(keyLengthFitnesses)
                    return (
                      <span>
                        My guess: <a onClick={()=>{this.setState({displayKeyLength: keyLength})}}>{keyLength}</a>.
                      </span>
                    )
                  })}
                </p>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="allowed-key-chars" className="col-sm-2 control-label">Allowed characters</label>
              <div className="col-sm-10">
                <input id="allowed-key-chars" name="displayAllowedKeyChars" value={displayAllowedKeyChars} onChange={this.onChange} className="form-control" />
                <p className="help-block">
                  Any set of characters, or a regex. To match any
                  printable ASCII characters, use
                  <code>{DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE}</code>.
                </p>
              </div>
            </div>
            <div className={`form-group ${!displayKeyValidator || keyValidatorFn ? '' : 'has-error'}`}>
              <label htmlFor="key-validator" className="col-sm-2 control-label">Validator</label>
              <div className="col-sm-10">
                <textarea id="key-validator" name="displayKeyValidator" value={displayKeyValidator} onChange={this.onChange} rows="5" className="form-control" />
                <p className="help-block">
                  A JS function that, when passed <var>k</var>, returns
                  whether or not <var>k</var> is a valid key. Ex:
                  <code>return k.charCodeAt(0) + k.charCodeAt(1) === 232</code>
                  will ensure the charCodes of the first two characters sum to 232.
                </p>
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <h4>Output</h4>
            <div className={`form-group ${knownPlaintexts.every(kp => kp !== null) ? '' : 'has-error'}`}>
              <label htmlFor="output-contains" className="col-sm-2 control-label">Known plaintext</label>
              <div className="col-sm-10">
                <textarea id="output-contains" name="displayKnownPlaintexts" value={displayKnownPlaintexts} onChange={this.onChange} rows="5" className="form-control" />
                <p className="help-block">
                  One per line, strings that the output must contain. To
                  include a linebreak, enter <code>\n</code> or <code>\r</code>.
                </p>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="allowed-output-chars" className="col-sm-2 control-label">Allowed characters</label>
              <div className="col-sm-10">
                <input id="allowed-output-chars" name="displayAllowedOutputChars" value={displayAllowedOutputChars} onChange={this.onChange} className="form-control" />
                <p className="help-block">
                  Any set of characters, or a regex. To match any
                  printable characters, use
                  <code>{DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE}</code>.
                </p>
              </div>
            </div>
            <div className={`form-group ${!displayOutputValidator || outputValidatorFn ? '' : 'has-error'}`}>
              <label htmlFor="output-validator" className="col-sm-2 control-label">Validator</label>
              <div className="col-sm-10">
                <textarea id="output-validator" name="displayOutputValidator" value={displayOutputValidator} onChange={this.onChange} rows="5" className="form-control" />
                <p className="help-block">
                  A JS function that, when passed <var>p</var>, returns
                  whether or not <var>p</var> is valid output. Ex:
                  <code>return p.match(/^a*$/m)</code>
                  will fail if any character in the output is not 'a'.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    )
  },

  render () {
    return this.state.bruteForceStatus === 'ACTIVE' ? this._render.throttled() : this._render()
  }
})
