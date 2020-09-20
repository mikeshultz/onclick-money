import React from 'react'

import './TokenBalance.css'

const TokenBalance = (props) => {
  const pendingClaims = !!props.claims ? Object.keys(props.claims).length : 0
  return (
    <div className="token-balance">
      <p>You've earned {props.tokens} CLIK tokens.</p>
      {pendingClaims ? 
        (<p>You have {pendingClaims} pending claims.</p>) :
        null
      }
      <p>You can <button className="redeem" onClick={props.toggleRedemption}>redeem</button> them when you're ready.</p>
    </div>
  )
}

export default TokenBalance
