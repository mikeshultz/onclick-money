import React from 'react'
import AccountSelector from './AccountSelector'
import { truncateToken } from '../utils/hex'
import { getClaim, combineClaim } from '../utils/claim'
import { NETWORKS, NET_BY_CONTRACT } from '../utils/eth'

import './RedemptionModal.css'

class RedemptionModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      generating: false,
      state: null,
      display: {}
    }

    this.generateClaim = this.generateClaim.bind(this)
    this.changeAccount = this.changeAccount.bind(this)
    this.toggleDisplay = this.toggleDisplay.bind(this)
  }

  generateClaim(ev) {
    ev.preventDefault()

    console.log('generateClaim token', this.props.token)
    console.log('generateClaim recipient', this.state.recipient)
    console.log('generateClaim contract', this.props.contract)

    getClaim(
      this.props.token,
      this.state.recipient,
      this.props.contract
    ).then(res => {
      console.log('getClaim res:', res)
      this.props.addClaim(this.props.token, res)
    })
  }

  changeAccount(ev) {
    const recipient = ev.target.value
    console.log('changeAccount:', recipient)
    this.setState({
      recipient
    })
  }

  toggleDisplay(id) {
    this.setState({
      display: {
        ...this.state.display,
        [id]: id in this.state.display ? !this.state.display[id] : true
      }
    })
  }

  render() {
    const { sendingClaim } = this.state
    const { toggleFAQ, className, generating, clicks, claims } = this.props
    const claimChildren = Object.keys(claims).map(k => {
      const net = NET_BY_CONTRACT[claims[k].contract]
      return (
        <React.Fragment key={k}>
          <tr className="claim">
            <td>{truncateToken(claims[k].token)}</td>
            <td>{claims[k].clicks} CLIK</td>
            <td>{NETWORKS[net]}</td>
            <td>
              <div className="button-group">
                <button className={`send-claim ${
                    sendingClaim ? 'loader loader-small' : ''
                }`} onClick={this.sendClaim}>
                    Send Claim
                </button>
                <button
                  className={`save-claim`}
                  onClick={() => this.toggleDisplay(k)}
                  >
                    {this.state.display[k] ? 'Hide' : 'Show'} Claim
                </button>
              </div>
            </td>
          </tr>
          <tr
            id={`${k}-claim`}
            className={`claim-display ${this.state.display[k] ? '' : 'hide'}`}
            >
            <td colSpan="4">
              {combineClaim(claims[k].claim, claims[k].signature)}
            </td>
          </tr>
        </React.Fragment>
      )
    })

    return (
      <div className={`modal-container ${className}`} onClick={(ev) => {
          if (ev.target === ev.currentTarget) {
              toggleFAQ(ev)
          }
      }}>
          <div className="modal redemption-modal">
              {clicks > 0 ? 
                (
                  <>
                    <h2>Redeem Your Clicks</h2>
                    <p>Redeem your clicks for a claim for CLIK tokens.</p>
                    <AccountSelector onAccountChange={this.changeAccount} />
                    <p>
                      <button className={`generate-claim ${
                          generating ? 'loader loader-small' : ''
                      }`} onClick={this.generateClaim}>
                          Generate Claim
                      </button>
                    </p>
                  </>
                ) : null
              }
              {claimChildren.length > 0 ? 
                (
                  <>
                    <h2>Your Claims</h2>
                    <table className="claims">
                      <thead>
                        <tr>
                          <td>ID</td>
                          <td>Tokens</td>
                          <td>Network</td>
                          <td></td>
                        </tr>
                      </thead>
                      <tbody>
                        {claimChildren}
                      </tbody>
                    </table>
                    <p className="disclaimer">
                      These claims are stored in your browser's local storage.
                      You may lose them if you clear your browser's storage.
                      Make sure to save or send them. <strong>If you lose them,
                      that's on you!</strong>
                    </p>
                  </>
                ) : null
              }
          </div>
      </div>
    )
  }
}

export default RedemptionModal
