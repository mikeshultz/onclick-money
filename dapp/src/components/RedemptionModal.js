import React from 'react'
import AccountSelector from './AccountSelector'
import ClaimContainer from './ClaimContainer'
import { truncateToken, add0xPrefix } from '../utils/hex'
import { getClaim, packClaim, unpackClaim } from '../utils/claim'
import { NETWORKS, NET_BY_CONTRACT, getProvider } from '../utils/eth'

import './RedemptionModal.css'

class RedemptionModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      generating: false,
      state: null,
      display: {},
      accounts: [],
      // Load claim state
      showLoadClaim: false,
      claimToLoad: ''
    }

    this.generateClaim = this.generateClaim.bind(this)
    this.changeAccount = this.changeAccount.bind(this)
    this.toggleDisplay = this.toggleDisplay.bind(this)
    this.sendClaim = this.sendClaim.bind(this)
    this.loadClaim = this.loadClaim.bind(this)
    this.changeClaimToLoad = this.changeClaimToLoad.bind(this)

    // Object containing accounts, contracts, provider, and signer
    this.wallet = null
  }

  componentDidMount() {
    this.connectWallet()
  }

  generateClaim(ev) {
    ev.preventDefault()

    getClaim(
      this.props.token,
      this.state.recipient,
      this.props.contract
    ).then(res => {
      console.debug('Generated claim:', res)
      this.props.addClaim(this.props.token, res)
      this.props.reset()
    })
  }

  async sendClaim(recipient, token, amount, signature) {
    token = add0xPrefix(token)

    // Try and validate the claim before sending a tx
    const hash = await this.wallet.clickToken.hashClaim(recipient, token, amount)
    const recoveredSigner = await this.wallet.clickToken.checkClaim(hash, signature)

    if (!recoveredSigner) {
      throw new Error('Claim failed validation check.  Invalid signature?')
    }

    // claim(address,bytes32,uint256,bytes)
    const method = this.wallet.clickToken['claim(address,bytes32,uint256,bytes)']
    const tx = await method(recipient, token, amount, signature)
    const receipt = await tx.wait()
    if (!receipt.status) {
      console.debug(tx)
      throw new Error('Transaction failed!')
    }
  }

  async connectWallet() {
    const provi = await getProvider(this.props.network)
    if (!provi.success) {
      this.props.handleError(new Error(provi.error))
    }
    this.wallet = provi
    this.setState({
      accounts: provi.accounts,
      recipient: !!provi.accounts && provi.accounts.length === 1 ?
        provi.accounts[0] :
        this.state.recipient
    })
  }

  changeAccount(ev) {
    const recipient = ev.target.value
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

  changeClaimToLoad(ev) {
    const claimToLoad = ev.target.value
    this.setState({
      claimToLoad
    })
  }

  loadClaim(ev) {
    const claimToLoad = this.state.claimToLoad
    const claim = unpackClaim(claimToLoad)
    this.props.addClaim(claim.token, claim)
    this.setState({
      claimToLoad: ''
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
                }`} onClick={() => {
                  this.sendClaim(
                    this.state.recipient,
                    claims[k].token,
                    claims[k].clicks,
                    claims[k].signature
                  )
                }}>
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
              <ClaimContainer claim={packClaim(claims[k])} />
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
                <p>
                  Redeem your clicks for a claim for CLIK tokens. Once your
                  claim is generated, you can not add clicks to it.
                </p>
                <AccountSelector
                  accounts={this.state.accounts}
                  onAccountChange={this.changeAccount}
                  />
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
                  that's on you!</strong>  You can save the hex strings for use
                  later at your convenience (or favorable gas prices).
                </p>
              </>
            ) : null
          }
          {this.state.display.claimLoadForm ? (
            <>
              <h2>Load Claim</h2>
              <div>
                <label>Paste a hexidecimal claim you saved from before</label>
                <textarea
                  className="claim-box"
                  value={this.state.claimToLoad}
                  onChange={this.changeClaimToLoad}
                  />
                <button
                  className="load-claim"
                  onClick={this.loadClaim}
                  >
                  Load
                </button>
              </div>
            </>
          ) : (
            <button
              className="load-claim"
              onClick={() => this.toggleDisplay('claimLoadForm')}
              >
              Load Saved Claim
            </button>
          )}
        </div>
      </div>
    )
  }
}

export default RedemptionModal
