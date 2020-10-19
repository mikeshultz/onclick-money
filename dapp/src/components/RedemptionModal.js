import React from 'react'
import { toast } from 'react-toastify';
import { Button, ButtonGroup } from '@material-ui/core'
import { DataGrid } from '@material-ui/data-grid'
import ethers from 'ethers'

import AccountSelector from './AccountSelector'
import ClaimContainer from './ClaimContainer'
import { truncateToken, add0xPrefix } from '../utils/hex'
import { getClaim, packClaim, unpackClaim } from '../utils/claim'
import {
  NETWORKS,
  NET_BY_CONTRACT,
  CONTRACTS,
  VALUES,
  SIGNERS,
  getProvider
} from '../utils/eth'
import { require } from '../utils/validation'

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

  async sendClaim(recipient, token, clicks, signature) {
    token = add0xPrefix(token)

    require(recipient, "Missing recipient")
    require(token, "Missing token")
    require(clicks, "Missing clicks")
    require(signature, "Missing signature")

    const amount = VALUES.oneEther.mul(clicks)

    /*console.log('recipient:', recipient)
    console.log('token:', token)
    console.log('amount:', amount)
    console.log('signature:', signature)*/

    const contractAddress = CONTRACTS[this.props.network]

    //console.log('contractAddress:', contractAddress)

    const checkHash = ethers.utils.solidityKeccak256(
      ['address', 'bytes32', 'uint256', 'address'],
      [recipient, token, amount, contractAddress]
    )
    // Try and validate the claim before sending a tx
    const hash = await this.wallet.clickToken.hashClaim(recipient, token, amount)
    
    /*console.log('hash:', hash)
    console.log('checkHash:', checkHash)*/

    console.debug(`Hash verification: ${hash} === ${checkHash} === ${hash === checkHash}`)

    if (hash !== checkHash) {
      throw new Error(`Hash verificaiton failed!  ${hash} != ${checkHash}`)
    }

    const recoveredSigner = await this.wallet.clickToken.checkClaim(hash, signature)

    console.debug('recoveredSigner:', recoveredSigner)
    console.debug('signers:', SIGNERS[this.props.network])

    if (!SIGNERS[this.props.network].includes(recoveredSigner)) {
      const errMsg = 'Claim failed validation check.  Invalid signature?'
      toast.error(errMsg)
      throw new Error(errMsg)
    }

    // claim(address,bytes32,uint256,bytes)
    const method = this.wallet.clickToken['claim(address,bytes32,uint256,bytes)']

    let tx
    try {
      tx = await method(recipient, token, amount, signature)
    } catch (err) {
      let msg = err.toString()

      // Not sure if this is just Metamask or what?
      if (err.data && err.data.message) {
        msg = err.data.message
      }

      if (msg.includes('already-claimed')) {
        this.props.handleWarning('Claim already redeemed!')
        this.props.removeClaim(token)
      } else {
        this.props.handleError(err)
      }

      return
    }

    // TODO: needs better UX
    const receipt = await tx.wait()

    console.debug(tx)
    console.debug(receipt)

    if (!receipt.status) {
      throw new Error('Transaction failed!')
    } else {
      this.props.removeClaim(token)
    }
  }

  async connectWallet() {
    const provi = await getProvider(this.props.network)
    if (!provi.success) {
      const e = new Error(provi.error ? provi.error : 'Error getting provider')
      this.props.handleError(e)
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
    const sendClaim = this.sendClaim
    const claimChildren = Object.keys(claims).map(k => {
      const net = NET_BY_CONTRACT[claims[k].contract]
      return (
        <React.Fragment key={k}>
          <tr className="claim">
            <td onClick={() => this.toggleDisplay(k)}>{truncateToken(claims[k].token)}</td>
            <td onClick={() => this.toggleDisplay(k)}>{claims[k].clicks} CLIK</td>
            <td onClick={() => this.toggleDisplay(k)}>{NETWORKS[net]}</td>
            <td>
              <ButtonGroup>
                <Button
                  variant="contained"
                  className={sendingClaim ? 'loader loader-small' : ''}
                  color="primary"
                  onClick={() => {
                    this.sendClaim(
                      this.state.recipient,
                      claims[k].token,
                      claims[k].clicks,
                      claims[k].signature
                    )
                  }}
                >
                  Send Claim
                </Button>

                <Button
                  variant="contained"
                  className="hide-mobile"
                  onClick={() => this.toggleDisplay(k)}
                >
                  {this.state.display[k] ? 'Hide' : 'Show'} Claim
                </Button>
              </ButtonGroup>
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
                  <Button
                    variant="contained"
                    color="primary"
                    className={generating ? 'loader loader-small' : ''}
                    onClick={this.generateClaim}
                  >
                    Generate Claim
                  </Button>
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
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.loadClaim}
                >
                  Load
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => this.toggleDisplay('claimLoadForm')}
            >
              Load Saved Claim
            </Button>
          )}
        </div>
      </div>
    )
  }
}

export default RedemptionModal
