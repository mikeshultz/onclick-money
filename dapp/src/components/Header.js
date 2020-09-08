import React from 'react'
import NetworkSelector from './NetworkSelector'

import './Header.css'

const Header = (props) => {
  return (
    <header className="header">
      <div className="brand">onclick.money</div>
      <NetworkSelector network={props.network} onNetworkChange={props.onNetworkChange} />
    </header>
  )
}

export default Header
