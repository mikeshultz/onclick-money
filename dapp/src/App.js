import React from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header'
import TokenButton from './components/TokenButton'
import TokenBalance from './components/TokenBalance'
import Footer from './components/Footer'
import FAQModal from './components/FAQModal'
import RedemptionModal from './components/RedemptionModal'
import { getClicks, sendClick } from './utils/clicks'
import { DEFAULT_NETWORK, NETWORKS, CONTRACTS, getProvider } from './utils/eth'
import { remove0xPrefix } from './utils/hex'

import 'App.css'

const LOCAL_STORAGE_TOKEN = 'token'
const LOCAL_STORAGE_NETWORK = 'ethnetwork'
const LOCAL_STORAGE_CLAIMS = 'claims'

class App extends React.Component {
  constructor(props) {
    super(props)

    const storedClaims = localStorage.getItem(LOCAL_STORAGE_CLAIMS)
    const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN)
    const storedNetwork = localStorage.getItem(LOCAL_STORAGE_NETWORK)
    const network = storedNetwork ? storedNetwork : DEFAULT_NETWORK
    const contract = network in CONTRACTS ? CONTRACTS[network] : CONTRACTS['1']

    console.log('network:', network)
    console.log('contract:', contract)

    this.state = {
      network,
      contract,
      clicking: false,
      token: storedToken,
      clicks: 0,
      tokenBalance: 0,
      showFAQ: false,
      showRedemption: false,
      claims: storedClaims ? JSON.parse(storedClaims) : {},
    }

    console.log('loaded claims: ', this.state.claims)

    this.updateClicks()
    this.updateBalance()

    this.click = this.click.bind(this)
    this.redeem = this.redeem.bind(this)
    this.reset = this.reset.bind(this)
    this.toggleFAQ = this.toggleFAQ.bind(this)
    this.toggleRedemption = this.toggleRedemption.bind(this)
    this.changeNetwork = this.changeNetwork.bind(this)
    this.addClaim = this.addClaim.bind(this)
    this.removeClaim = this.removeClaim.bind(this)
    this.handleError = this.handleError.bind(this)
    this.updateBalance = this.updateBalance.bind(this)
  }

  updateClicks() {
    if (this.state.token) {
      getClicks(this.state.token).then(resp => {
        if (!resp.success) {
          console.error(resp.message)
        } else {
          this.setState({
            clicks: resp.clicks
          })
        }
      })
    }
  }

  async updateBalance() {
    try {
      console.log('updateBalance')
      if (!this.state.network) {
        console.debug('Cannot update balance, network not set.')
        return
      }
      console.log('this.state.network:', this.state.network)
      const { success, clickToken, signer } = await getProvider(this.state.network)
      if (!success || !signer) {
        console.log('returning', success, signer)
        return
      }

      const address = await signer.getAddress()
      console.log('address:', address)
      const tokenBalance = await clickToken.balanceOf(address)
      console.log(`${address} has a balance of ${tokenBalance}`)
      this.setState({
        tokenBalance
      })
    } catch (err) {
      console.error(err)
    }
  }

  click(ev) {
    ev.preventDefault()

    this.setState({
      clicking: true
    })

    if (this.state.clicking) {
      console.warn('Already clicking...')
      return
    }

    sendClick(this.state.token).then(resp => {
      this.setState({
        token: resp.token ? resp.token : this.state.token,
        clicks: resp.clicks,
        clicking: false
      })

      if (resp.token) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN, resp.token)
      }
    }).catch(err => {
      console.error(err)
      this.setState({
        clicking: false
      })
    })
  }

  redeem(ev) {
    ev.preventDefault()
    console.log('open redemption modal')
  }

  toggleFAQ(ev) {
    ev.preventDefault()
    this.setState({
      showFAQ: !this.state.showFAQ
    })
  }

  toggleRedemption(ev) {
    ev.preventDefault()
    this.setState({
      showRedemption: !this.state.showRedemption
    })
  }

  changeNetwork(ev) {
    console.log(`changeNetwork to ${ev.target.value}`)
    const network = ev.target.value

    if (!(network in NETWORKS)) {
      throw new Error('Invalid network')
    }

    const contract = network in CONTRACTS ? CONTRACTS[network] : CONTRACTS['1']

    localStorage.setItem(LOCAL_STORAGE_NETWORK, network)

    this.setState({
      network,
      contract
    })
  }

  addClaim(token, claim) {
    console.log('addClaim:', claim)
    const claims = {
      ...this.state.claims,
      [token]: claim
    }
    console.log('claims:', claims)
    this.setState({
      claims
    })
    localStorage.setItem(LOCAL_STORAGE_CLAIMS, JSON.stringify(claims))
  }

  removeClaim(token) {
    token = remove0xPrefix(token)
    const claims = {
      ...this.state.claims
    }
    console.log(`delete ${token} from claims`)
    delete claims[token]
    console.log('newClaims:', claims)
    this.setState({
      claims
    })
  }

  reset() {
    this.setState({
      clicks: 0,
      token: null,
    })
    localStorage.setItem(LOCAL_STORAGE_TOKEN, '')
  }

  handleError(err) {
    console.error(err)
    toast(err.message)
  }

  render() {
    return (
      <div className="app-container">
        <Header network={this.state.network} onNetworkChange={this.changeNetwork} />
        <div className="header-pad" />
        <TokenButton onClick={this.click} clicking={this.state.clicking} />
        <TokenBalance
          tokenBalance={this.state.tokenBalance}
          tokens={this.state.clicks}
          toggleRedemption={this.toggleRedemption}
          claims={this.state.claims}
          />
        <Footer toggleFAQ={this.toggleFAQ} toggleRedemption={this.toggleRedemption} />

        <FAQModal
          className={this.state.showFAQ ? '' : 'hide'}
          toggleFAQ={this.toggleFAQ}
          />

        <RedemptionModal
          className={this.state.showRedemption ? '' : 'hide'}
          toggleFAQ={this.toggleRedemption}
          token={this.state.token}
          contract={this.state.contract}
          clicks={this.state.clicks}
          addClaim={this.addClaim}
          removeClaim={this.removeClaim}
          claims={this.state.claims}
          handleError={this.handleError}
          network={this.state.network}
          reset={this.reset}
          />

        <ToastContainer position="bottom-right" newestOnTop={true} />
      </div>
    )
  }
}

export default App
