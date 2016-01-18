import React from 'react'
import ReactDOM from 'react-dom'
import {Router, Route} from 'react-router'
import $ from 'jquery'; window.jQuery = $

import App from './components/App.jsx'

ReactDOM.render((
  <App />
), document.getElementById('app'))

jQuery($ => {
  $('body').tooltip({
    selector: '[data-toggle="tooltip"], .public_fixedDataTableCell_wrap1:not(.column-Tree-body-cell) .public_fixedDataTableCell_cellContent',
    container: 'body',
    title: function () {
      var $el = $(this)
      return $el.attr('title') || $el.text()
    }
  })
})
