import React, { useState } from 'react'
import { isValidAddress, isValidChecksumAddress } from 'ethereumjs-util'

import './AccountSelector.css'

const AccountSelector = (props) => {
  const [showManual, setShowManual] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [addressWarning, setAddressWarning] = useState('')
  const [manualGood, setManualGood] = useState(false)

  const children = props.accounts ? Object.keys(props.accounts).map(k => {
    return (
      <option key={k} value={k}>{k}</option>
    )
  }) : []

  const selectChange = (ev) => {
    if (ev.target.value === '-') {
      setShowManual(false)
    } else if (ev.target.value === 'manual') {
      setShowManual(true)
    } else {
      props.onAccountChange(ev)
    }
  }

  const inputChange = (ev) => {
    const address = ev.target.value
    setManualAddress(address)
    try {
      if (isValidAddress(address)) {
        if (!isValidChecksumAddress(address)) {
          setAddressWarning('Address does not checksum! Are you sure this is accurate?')
          setManualGood(false)
        } else {
          setAddressWarning('')
          setManualGood(true)
        }

        props.onAccountChange(ev)
      } else {
        setAddressWarning('')
        setManualGood(false)
      }
    } catch (err) {
      if (!err.toString().includes('0x-prefixed hex strings')) {
        console.error(err)
      }
    }
  }

  return (
    <div className="account-selector">
      {!!props.accounts && props.accounts.length === 1 ? (
        <div className="selected-account">Claim for account: {props.accounts[0]}</div>
      ) : (
        <>
          <div className="form-field">
            <label htmlFor="manual">Account:</label>
            <select name="select" onChange={selectChange}>
              <option key="-" value="-">Select an Account</option>
              {children}
              <option key="manual" value="manual">Use another account</option>
            </select>
          </div>

          <div className={`form-field ${showManual ? '' : 'hide'}`}>
            <label htmlFor="manual">Address:</label>
            <input
              type="text"
              name="manual"
              className={manualGood ? 'good' : ''}
              onChange={inputChange}
              value={manualAddress}
              />
            <p className="form-help warning">{addressWarning}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default AccountSelector
