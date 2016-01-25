import React from 'react'
import {Link, IndexLink} from 'react-router'

export default ({children, index=false, ...props}) => {
  var LinkComponent = index ? IndexLink : Link
  return (
    <LinkComponent {...props} activeClassName="active">
      {children}
    </LinkComponent>
  )
}
