import React from 'react'
import { newWindow } from '../utils/window'
import NetworkSelector from './NetworkSelector'

import './Footer.css'

const Footer = (props) => {

  return (
    <nav className="nav">
      <a className="nav-link" href="#" onClick={props.toggleFAQ}>FAQ</a>
      <a className="nav-link" href="#" onClick={props.toggleFAQ}>Send saved claim</a>
      <a
        className="nav-link"
        href="https://github.com/mikeshultz/onclick-money"
        onClick={newWindow}
        >
            Source Code
        </a>
    </nav>
  )
}

export default Footer
