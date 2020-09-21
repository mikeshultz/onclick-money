import React from 'react'
import { bnToDecimalString } from '../utils/bn'

import './TokenBalance.css'

const TokenBalance = (props) => {
  const pendingClaims = !!props.claims ? Object.keys(props.claims).length : 0
  const decimalBalance = bnToDecimalString(props.tokenBalance)
  console.log('decimalBalance:', decimalBalance)
  return (
    <div className="token-balance">
      <p>You've earned {props.tokens} CLIK unclaimed tokens.</p>
      {pendingClaims ? 
        (<p>You have {pendingClaims} pending claims.</p>) :
        null
      }
      {props.tokenBalance ? (
        <p>Your account has a balance of {decimalBalance} CLIK.</p>
      ) : null}
      <p>You can <button className="redeem" onClick={props.toggleRedemption}>redeem</button> them when you're ready.</p>
    </div>
  )
}

export default TokenBalance
