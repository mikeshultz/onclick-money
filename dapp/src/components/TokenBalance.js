import React from 'react'

import './TokenBalance.css'

const TokenBalance = (props) => {
  return (
    <div className="token-balance">
        <p>You've earned {props.tokens} CLIK tokens.</p>
        <p>You can <button className="redeem" onClick={props.toggleRedemption}>redeem</button> them when you're ready.</p>
    </div>
  )
}

export default TokenBalance
