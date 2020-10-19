import React from 'react'
import { Box } from '@material-ui/core'

import { newWindow } from '../utils/window'
import NetworkSelector from './NetworkSelector'

import './Footer.css'

const Footer = (props) => {

  return (
    <Box component="nav" className="nav">
      <a className="nav-link" href="#" onClick={props.toggleFAQ}>FAQ</a>
      <a className="nav-link" href="#" onClick={props.toggleRedemption}>Load saved claim</a>
      <a
        className="nav-link"
        href="https://github.com/mikeshultz/onclick-money"
        onClick={newWindow}
      >
        Source Code
      </a>
      {process.env.NODE_ENV !== 'production' ? (
        <a className="nav-link" href="#" onClick={props.toggleDebug}>
          DEBUG
        </a>
      ) : null}
    </Box>
  )
}

export default Footer
