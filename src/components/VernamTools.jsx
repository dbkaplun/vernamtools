import React from 'react'
import _ from 'lodash'
import Promise from 'bluebird'
import mem from 'mem'
import moment from 'moment'

import vernam, {guessDivisors} from '../vernam'
import VernamBruteForcer from '../VernamBruteForcer'
import {strToRe} from '../strOps'

const DISPLAYABLE_CHARACTERS_RE = /^[^\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]+$/ // all but 0x00-0x08, 0x0b-0x0c, 0x0e-0x1f, 0x7f-0x9f
const DISPLAYABLE_ASCII_CHARACTERS_RE = /^[\u0020-\u007E]+$/
const DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE = `/${DISPLAYABLE_CHARACTERS_RE.source}/`
const DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE = `/${DISPLAYABLE_ASCII_CHARACTERS_RE.source}/`
const QUOTES_ENDS_RE = /(^")|("$)/g

const returnTrue = _.constant(true)

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
  if (!validatorString) return returnTrue

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
    let fn = new Function(paramNames, validatorString)
    return _.merge(mem((...args) => {
      try { return fn(...args) }
      catch (e) { console.error(e) }

      return false
    }), {fn})
    return validator
  } catch (e) {
    console.error(e)
  }
  return null
})

const formatNumber = (n, locale='en-US', opts={maximumFractionDigits: 0}) => (
  n.toLocaleString(locale, opts)
)

const invalidChars = (string, validator) => {
  return _(string)
    .reject(validator)
    .uniq()
    .value()
}

const evtStateHandler = fn => function (evt) {
  this.setState(fn.apply(this, [{}, evt.target.value, ...arguments]))
}

export default React.createClass({
  getInitialState () {
    return {
      displayInput: '',
      displayKey: '',
      displayOutputPrefix: '',
      displayKeyLength: '',
      keyLengthMax: 64,
      displayKeyAllowedChars: DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE,
      displayKeyValidator: '',
      displayKnownPlaintexts: '',
      displayOutputAllowedChars: '',
      displayOutputValidator: '',

      bruteForceBatchSize: 50,
      bruteForceState: {},

      renderThrottle: 200,

      demoState: {
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
        displayKeyLength: '9',
        displayKeyAllowedChars: DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE,
        displayKeyValidator: '',
        displayKnownPlaintexts: 'document',
        displayOutputAllowedChars: DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE,
        displayOutputValidator: `
  try {
    eval(p);
  } catch (e) {
    if (e.name === 'SyntaxError') return false;
  }
  return true;
        `.trim()
      }
    }
  },

  componentWillMount () {
    this._render.throttled = _.throttle(this._render, this.state.renderThrottle)

    _.each([
      'updateDisplayInput',
      'updateDisplayKey', 'updateDisplayOutputPrefix',
      'updateDisplayKeyLength', 'updateDisplayKeyAllowedChars', 'updateDisplayKeyValidator',
      'updateDisplayKnownPlaintexts', 'updateDisplayOutputAllowedChars', 'updateDisplayOutputValidator'
    ], prop => { this[prop].handler = evtStateHandler(this[prop]).bind(this) })

    this.setState(this.updateDisplayState(this.state))
  },

  updateDisplayState (displayState) {
    let {
      displayInput, displayOutputPrefix,
      displayKeyLength, displayKeyAllowedChars, displayKeyValidator,
      displayKnownPlaintexts, displayOutputAllowedChars, displayOutputValidator
    } = this.getState(displayState)

    // set validators before inputting data
    displayState = this.updateDisplayKeyLength(displayState, displayKeyLength)
    displayState = this.updateDisplayKeyAllowedChars(displayState, displayKeyAllowedChars)
    displayState = this.updateDisplayKeyValidator(displayState, displayKeyValidator)

    displayState = this.updateDisplayKnownPlaintexts(displayState, displayKnownPlaintexts)
    displayState = this.updateDisplayOutputAllowedChars(displayState, displayOutputAllowedChars)
    displayState = this.updateDisplayOutputValidator(displayState, displayOutputValidator)

    // set now-validatable data
    displayState = this.updateDisplayInput(displayState, displayInput)
    displayState = this.updateDisplayOutputPrefix(displayState, displayOutputPrefix) // sets key

    return displayState
  },

  getState (newState) {
    return _.defaults({}, newState, this.state)
  },

  // Brute force
  updateBruteForceState (newState, newBruteForceState) {
    let {bruteForceState} = this.getState(newState)
    bruteForceState = _.merge({}, bruteForceState, newBruteForceState)
    return _.merge(newState, {bruteForceState})
  },
  resetBruteForce (newState) {
    let state = this.getState(newState)
    let {input='', keyLength} = state
    newState = this.updateBruteForceState(newState, {
      status: 'STOPPED',
      duration: 0
    })
    newState.pastValidOutputs = []
    newState.bruteForceState.vernamBruteForcer = new VernamBruteForcer(_(state)
      .pick(
        'keyLengthMax', 'keyCharValidator', 'keyValidator',
        'knownPlaintexts', 'outputCharValidator', 'outputValidator')
      .merge(keyLength && {keyLengths: [{keyLength, fitness: 1}]})
      .pickBy(Boolean)
      .merge({ciphertext: input})
      .value())
    return newState
  },
  initBruteForce (newState) {
    let {status, startTime, duration} = this.getState(newState).bruteForceState
    if (status === 'ACTIVE') return newState // already inited
    if (status !== 'PAUSED') {
      newState = this.resetBruteForce(newState)
    } else if (startTime) {
      // state === PAUSED (in the middle of a brute force)
      // update duration
      this.updateBruteForceState(newState, {
        duration: (duration || 0) + (Date.now() - startTime)
      })
    }
    return this.updateBruteForceState(newState, {
      status: 'ACTIVE',
      startTime: Date.now()
    })
  },
  guessWhile: Promise.method(function (iteratee=returnTrue) {
    let {status, vernamBruteForcer} = this.state.bruteForceState
    if (status !== 'ACTIVE' || !iteratee()) return
    return new Promise(resolve => {
      this.setState(this.updateKey({}, vernamBruteForcer.nextGuess()), resolve)
    })
      .delay() // unblocks event loop
      .then(() => this.guessWhile(iteratee))
  }),

  bruteForce (...args) {
    return new Promise(resolve => this.setState(this.initBruteForce(), resolve))
      .then(() => this.guessWhile(...args))
      .return({status: 'PAUSED'})
      .catch(err => {
        switch (err.code) {
          case 'KEYSPACE_EXHAUSTED': return {status: err.code}
          default: throw err
        }
      })
      .then(newBruteForceState => this.updateBruteForceState({}, newBruteForceState))
      .then(newState => {
        let {bruteForceState} = newState
        if ('startTime' in bruteForceState) {
          bruteForceState.duration = _.get(bruteForceState, 'duration', 0) + Date.now() - bruteForceState.startTime
          delete bruteForceState.startTime
        }
        return new Promise(resolve => this.setState(newState, resolve))
      })
  },
  bruteForceBatch (count=this.state.bruteForceBatchSize) {
    let index = 0
    this.bruteForce(() => index++ < count).done()
  },
  toggleBruteForce () {
    if (this.state.bruteForceState.status !== 'ACTIVE') this.bruteForce().done()
    else this.setState(this.updateBruteForceState({}, {status: 'PAUSED'}))
  },

  // handlers
  updateDisplayInput (newState, displayInput) {
    _.merge(newState, {
      displayInput,
      input: fromDisplayString(displayInput),
      pastValidOutputs: []
    })
    newState = this.validateInput(newState)
    newState = this.updateOutput(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },

  updateKey (newState, key, displayKey) {
    if (typeof displayKey !== 'string') displayKey = toDisplayString(key)
    _.merge(newState, {key, displayKey})
    newState = this.validateKey(newState)
    newState = this.updateOutput(newState)
    return newState
  },
  updateDisplayKey (newState, displayKey) {
    return this.updateKey(newState, fromDisplayString(displayKey), displayKey)
  },
  updateDisplayKeyLength (newState, displayKeyLength) {
    _.merge(newState, {displayKeyLength, keyLength: Number(displayKeyLength)})
    newState = this.validateKey(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },
  updateDisplayKeyAllowedChars (newState, displayKeyAllowedChars) {
    _.merge(newState, {
      displayKeyAllowedChars,
      keyCharValidator: parseCharValidator(displayKeyAllowedChars)
    })
    newState = this.validateKey(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },
  updateDisplayKeyValidator (newState, displayKeyValidator) {
    _.merge(newState, {
      displayKeyValidator,
      keyValidator: parseValidator('k', displayKeyValidator)
    })
    newState = this.validateKey(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },

  updateDisplayOutputPrefix (newState, displayOutputPrefix) {
    _.merge(newState, {displayOutputPrefix})

    // compute key from output prefix
    // this updates output, which indirectly updates outputPrefix
    let {input} = this.getState(newState)
    let outputPrefix = fromDisplayString(displayOutputPrefix)
    if (outputPrefix !== null) newState = this.updateKey(newState, vernam((input || '').slice(0, outputPrefix.length), outputPrefix))
    return newState
  },
  updateDisplayKnownPlaintexts (newState, displayKnownPlaintexts) {
    _.merge(newState, {
      displayKnownPlaintexts,
      knownPlaintexts: arrayFromDisplayString(displayKnownPlaintexts)
    })
    newState = this.validateOutput(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },
  updateDisplayOutputAllowedChars (newState, displayOutputAllowedChars) {
    _.merge(newState, {
      displayOutputAllowedChars,
      outputCharValidator: parseCharValidator(displayOutputAllowedChars)
    })
    newState = this.validateOutput(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },
  updateDisplayOutputValidator (newState, displayOutputValidator) {
    _.merge(newState, {
      displayOutputValidator,
      outputValidator: parseValidator('p', displayOutputValidator)
    })
    newState = this.validateOutput(newState)
    newState = this.resetBruteForce(newState)
    return newState
  },

  updateOutput (newState) {
    let {input, key} = this.getState(newState)
    key = key || ''
    input = input || ''
    let output = vernam(input, key)
    let outputPrefix = output.slice(0, key.length)
    return this.validateOutput(_.merge(newState, {
      output,
      outputPrefix,
      displayOutput: toDisplayString(output),
      displayOutputPrefix: toDisplayString(outputPrefix)
    }))
  },

  // validations
  validateInput (newState) {
    let {input} = this.getState(newState)
    let isDisplayInputValid = input !== null
    return _.merge(newState, {
      isDisplayInputValid,
      isInputValid: isDisplayInputValid
    })
  },
  validateOutput (newState) {
    let {key, output, outputPrefix, knownPlaintexts, outputCharValidator, outputValidator, pastValidOutputs} = this.getState(newState)
    let isDisplayOutputValid = output !== null
    output = output || ''
    let isOutputCharsValid = !outputCharValidator || _.every(output, outputCharValidator)
    let isOutputValidForValidator = !outputValidator || outputValidator(output)
    let missingPlaintexts = (knownPlaintexts || []).filter(plain => plain !== null && output.indexOf(plain) === -1)
    let isOutputValid = isDisplayOutputValid && isOutputCharsValid && isOutputValidForValidator && !missingPlaintexts.length

    if (output && isOutputValid) pastValidOutputs = [{key, output}, ...pastValidOutputs].slice(0, 50)
    return _.merge(newState, {
      isDisplayOutputValid,
      isOutputCharsValid,
      isOutputValidForValidator,
      missingPlaintexts,
      isOutputValid,
      pastValidOutputs
    })
  },
  validateKey (newState) {
    let {key, keyLength, keyCharValidator, keyValidator} = this.getState(newState)
    let isDisplayKeyValid = key !== null
    key = key || ''
    let isKeyCharsValid = !keyCharValidator || _.every(key, keyCharValidator)
    let isKeyValidForValidator = !keyValidator || keyValidator(key)
    let isKeyLengthValid = !keyLength || key.length === keyLength
    return _.merge(newState, {
      isDisplayKeyValid,
      isKeyCharsValid,
      isKeyValidForValidator,
      isKeyLengthValid,
      isKeyValid: isDisplayKeyValid && isKeyCharsValid && isKeyValidForValidator && isKeyLengthValid
    })
  },

  _render () {
    const {
      // input
      input, displayInput,
      isInputValid,

      // key
      key, displayKey,
      isKeyValid, isKeyLengthValid,
      // key validators
      keyLength, displayKeyLength, keyLengthMax,
      displayKeyAllowedChars, keyCharValidator,
      displayKeyValidator, keyValidator, isKeyValidForValidator,

      // output
      output, displayOutput, outputPrefix, displayOutputPrefix,
      isOutputValid,
      // output validators
      knownPlaintexts, displayKnownPlaintexts, missingPlaintexts,
      displayOutputAllowedChars, outputCharValidator,
      displayOutputValidator, outputValidator, isOutputValidForValidator,

      // brute force
      bruteForceState, bruteForceBatchSize, pastValidOutputs,

      // other
      demoState
    } = this.state
    let {vernamBruteForcer, duration, startTime} = bruteForceState
    let {keyLengths} = vernamBruteForcer
    let canBruteForce = input && isInputValid
    let currentKeyLength = _.get(keyLengths, [vernamBruteForcer.state.keyLengthIndex, 'keyLength'])
    // let keyLengthDivisorGuesses = guessDivisors(keyLengths)

    if ('startTime' in bruteForceState) duration += Date.now() - startTime
    duration = moment.duration(duration)

    let invalidOutputPrefixChars = invalidChars(outputPrefix || '', outputCharValidator)
    let invalidOutputChars = invalidChars(output || '', outputCharValidator)
    let invalidKeyChars = invalidChars(key || '', keyCharValidator)


    return (
      <form className="form-horizontal container" role="form">
        <h1 className="clearfix">
          vernamtools
          {' '}
          <small>code, ★ on <a href="https://github.com/dbkaplun/vernamtools" target="_blank">Github</a></small>
        </h1>
        <div className="row">
          <div className="col-sm-6">
            <div className={`form-group ${isKeyValid ? '' : 'has-error'}`}>
              <label htmlFor="key" className="col-sm-3 control-label">Key</label>
              <div className="col-sm-9">
                <input id="key" value={displayKey} onChange={this.updateDisplayKey.handler} placeholder={canBruteForce ? "Ready to brute force..." : ""} className="form-control" />
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
                <p className={`help-block ${!isKeyValidForValidator ? '' : 'hide'}`}>
                  Validator failed this key.
                </p>
              </div>
            </div>
            <div className={`form-group ${isInputValid ? '' : 'has-error'}`}>
              <label htmlFor="input" className="col-sm-3 control-label">Input</label>
              <div className="col-sm-9">
                <textarea id="input" value={displayInput} onChange={this.updateDisplayInput.handler} rows="5" className="form-control" autofocus />
              </div>
            </div>
            <div className={`form-group ${canBruteForce ? '' : 'has-error'}`}>
              <div className="col-sm-9 col-sm-offset-3">
                <h3>Brute force</h3>
                <div>
                  <span className="btn-group">
                    <button onClick={()=>{this.toggleBruteForce()}} title="Brute force" disabled={!canBruteForce} className={`btn btn-success ${bruteForceState.status === 'ACTIVE' ? 'active' : ''}`} data-toggle="tooltip" type="button">
                      <span className={`glyphicon ${bruteForceState.status === 'ACTIVE' ? 'glyphicon-pause' : 'glyphicon-play'}`}></span>
                    </button>
                    <button onClick={()=>{this.bruteForceBatch(1)}} title="Next guess" disabled={!canBruteForce} className="btn btn-primary" data-toggle="tooltip" type="button">
                      <span className="glyphicon glyphicon-step-forward"></span>
                    </button>
                    <button onClick={()=>{this.bruteForceBatch()}} title={`Take ${bruteForceBatchSize} guesses`} disabled={!canBruteForce} className="btn btn-warning" data-toggle="tooltip" type="button">
                      <span className="glyphicon glyphicon-fast-forward"></span>
                    </button>
                  </span>
                  <span className="text-muted">{' '}&bull;{' '}</span>
                  <button onClick={()=>{this.setState(this.updateDisplayState(demoState))}} title="Load demo input" className="btn btn-danger" data-toggle="tooltip" data-placement="bottom" type="button">
                    <span className="glyphicon glyphicon-open" aria-hidden="true"></span>
                  </button>
                </div>
                <hr />
                <dl className="dl-horizontal">
                  <dt title="Status" data-toggle="tooltip">
                    <span className="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
                  </dt>
                  <dd>{bruteForceState.status}</dd>

                  <dt className={currentKeyLength ? '' : 'hide'} title={`Keys attempted, ${currentKeyLength} characters`} data-toggle="tooltip">
                    <span className="glyphicon glyphicon-heart-empty" aria-hidden="true"></span>
                  </dt>
                  <dd className={currentKeyLength ? '' : 'hide'}>{
                    currentKeyLength
                      ? formatNumber(vernamBruteForcer.getAttemptedKeySpaceSize(currentKeyLength))
                      : ''
                  }</dd>

                  <dt className={currentKeyLength ? '' : 'hide'} title={`Approximate keyspace size, ${currentKeyLength} characters`} data-toggle="tooltip">
                    <span className="glyphicon glyphicon-heart" aria-hidden="true"></span>
                  </dt>
                  <dd className={currentKeyLength ? '' : 'hide'}>{
                    currentKeyLength
                      ? formatNumber(vernamBruteForcer.getOptimizedKeySpaceSize(currentKeyLength))
                      : ''
                  }</dd>

                  <dt className={+duration ? '' : 'hide'} title="Duration" data-toggle="tooltip">
                    <span className="glyphicon glyphicon-time" aria-hidden="true"></span>
                  </dt>
                  <dd className={+duration ? '' : 'hide'}>{
                    +duration < 45000
                      ? `${duration.asSeconds()}s`
                      : duration.humanize()
                  }</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className={`form-group ${!invalidOutputPrefixChars.length ? '' : 'has-error'}`}>
              <label htmlFor="output-prefix" className="col-sm-3 control-label">Output prefix</label>
              <div className="col-sm-9">
                <input id="output-prefix" value={displayOutputPrefix} onChange={this.updateDisplayOutputPrefix.handler} className="form-control" />
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
                  <textarea value={displayOutput} readOnly={true} rows="5" className="form-control" />
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
                        let updateKeyOnClick = evtStateHandler((newState, unused, evt) => {
                          evt.preventDefault()
                          return this.updateKey(newState, key, displayKey)
                        }).bind(this)
                        return (
                          <tr key={i}>
                            <td>{i}</td>
                            <td><a onClick={updateKeyOnClick} href=""><code>{displayKey}</code></a></td>
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
              <p className={`help-block ${isInputValid && !isOutputValidForValidator ? '' : 'hide'}`}>
                Validator failed this output.
              </p>
              <p className={`help-block ${!isInputValid ? '' : 'hide'}`}>
                Input is not escaped properly.
              </p>
            </div>
          </div>
        </div>

        <div className="page-header"><h3>Validations <small>make brute force faster by reducing search space with key and output constraints</small></h3></div>
        <div className="row">
          <div className="col-sm-6">
            <h4>Key</h4>
            <div className={`form-group ${keyLength === keyLength /* isNaN(keyLength) */ ? '' : 'has-error'}`}>
              <label htmlFor="key-length" className="col-sm-2 control-label">Length</label>
              <div className="col-sm-10">
                <input id="key-length" value={displayKeyLength} onChange={this.updateDisplayKeyLength.handler} type="number" min="0" max={keyLengthMax} className="form-control" />
                <p className="help-block">
                  {/*
                  <span className={keyLengthDivisorGuesses.length ? '' : 'hide'}>
                    Likely divisible by {keyLengthDivisorGuesses[0]}.
                  </span>
                  {' '}
                  */}
                  {_.attempt(() => {
                    if (!keyLengths.length) return ''
                    let {keyLength} = _.first(keyLengths)
                    let updateKeyLengthOnClick = evtStateHandler((newState, unused, evt) => {
                      evt.preventDefault()
                      return this.updateDisplayKeyLength(newState, keyLength)
                    }).bind(this)
                    return (
                      <span>
                        My guess: <a onClick={updateKeyLengthOnClick}>{keyLength}</a>.
                      </span>
                    )
                  })}
                </p>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="allowed-key-chars" className="col-sm-2 control-label">Allowed characters</label>
              <div className="col-sm-10">
                <input id="allowed-key-chars" value={displayKeyAllowedChars} onChange={this.updateDisplayKeyAllowedChars.handler} className="form-control" />
                <p className="help-block">
                  Any set of characters, or a regex. To match any
                  printable ASCII characters, use
                  <code>{DISPLAY_DISPLAYABLE_ASCII_CHARACTERS_RE_SOURCE}</code>.
                </p>
              </div>
            </div>
            <div className={`form-group ${!displayKeyValidator || keyValidator ? '' : 'has-error'}`}>
              <label htmlFor="key-validator" className="col-sm-2 control-label">Validator</label>
              <div className="col-sm-10">
                <textarea id="key-validator" value={displayKeyValidator} onChange={this.updateDisplayKeyValidator.handler} rows="5" className="form-control" />
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
                <textarea id="output-contains" value={displayKnownPlaintexts} onChange={this.updateDisplayKnownPlaintexts.handler} rows="5" className="form-control" />
                <p className="help-block">
                  One per line, strings that the output must contain. To
                  include a linebreak, enter <code>\n</code> or <code>\r</code>.
                </p>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="allowed-output-chars" className="col-sm-2 control-label">Allowed characters</label>
              <div className="col-sm-10">
                <input id="allowed-output-chars" value={displayOutputAllowedChars} onChange={this.updateDisplayOutputAllowedChars.handler} className="form-control" />
                <p className="help-block">
                  Any set of characters, or a regex. To match any
                  printable characters, use
                  <code>{DISPLAY_DISPLAYABLE_CHARACTERS_RE_SOURCE}</code>.
                </p>
              </div>
            </div>
            <div className={`form-group ${!displayOutputValidator || outputValidator ? '' : 'has-error'}`}>
              <label htmlFor="output-validator" className="col-sm-2 control-label">Validator</label>
              <div className="col-sm-10">
                <textarea id="output-validator" value={displayOutputValidator} onChange={this.updateDisplayOutputValidator.handler} rows="5" className="form-control" />
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
        <p>
          <small>JSON strings are used everywhere, so make sure to escape your data.</small>
        </p>
      </form>
    )
  },

  render () {
    return this.state.bruteForceState.status === 'ACTIVE' ? this._render.throttled() : this._render()
  }
})
