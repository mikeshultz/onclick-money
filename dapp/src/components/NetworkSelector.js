import React from 'react'
import { DEFAULT_NETWORK, NETWORKS } from '../utils/eth'

import './NetworkSelector.css'

const NetworkSelector = (props) => {
  const networks = props.networks ? props.networks : NETWORKS
  const children = Object.keys(networks).map(k => {
    return (
      <option key={k} value={k}>{k} - {networks[k]}</option>
    )
  })
  return (
    <div className="network-selector">
      Network: &nbsp; 
      <select value={props.network} onChange={props.onNetworkChange}>
        {children}
      </select>
    </div>
  )
}

export default NetworkSelector
