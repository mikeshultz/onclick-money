import React from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Container, CssBaseline } from '@material-ui/core'

import Header from './components/Header'
import TokenButton from './components/TokenButton'
import TokenBalance from './components/TokenBalance'
import Footer from './components/Footer'
import FAQModal from './components/FAQModal'
import DebugModal from './components/DebugModal'
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

    this.state = {
      network,
      contract,
      clicking: false,
      token: storedToken,
      clicks: 0,
      tokenBalance: 0,
      showFAQ: false,
      showDebug: false,
      showRedemption: false,
      claims: storedClaims ? JSON.parse(storedClaims) : {},
    }

    this.updateClicks()
    this.updateBalance()

    this.click = this.click.bind(this)
    this.reset = this.reset.bind(this)
    this.toggleFAQ = this.toggleFAQ.bind(this)
    this.toggleDebug = this.toggleDebug.bind(this)
    this.toggleRedemption = this.toggleRedemption.bind(this)
    this.closeRedemption = this.closeRedemption.bind(this)
    this.changeNetwork = this.changeNetwork.bind(this)
    this.addClaim = this.addClaim.bind(this)
    this.removeClaim = this.removeClaim.bind(this)
    this.handleWarning = this.handleWarning.bind(this)
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
      if (!this.state.network) {
        console.debug('Cannot update balance, network not set.')
        return
      }

      const { success, clickToken, signer } = await getProvider(this.state.network)
      if (!success || !signer) {
        console.log('returning', success, signer)
        return
      }

      const address = await signer.getAddress()

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

  toggleFAQ(ev) {
    ev.preventDefault()
    this.setState({
      showFAQ: !this.state.showFAQ
    })
  }

  toggleDebug(ev) {
    ev.preventDefault()
    this.setState({
      showDebug: !this.state.showDebug
    })
  }

  toggleRedemption(ev) {
    ev.preventDefault()
    this.setState({
      showRedemption: !this.state.showRedemption
    })
  }

  closeRedemption(ev) {
    if (ev) ev.preventDefault()
    this.setState({
      showRedemption: false
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
    const claims = {
      ...this.state.claims,
      [token]: claim
    }

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

    console.debug(`delete ${token} from claims`)

    delete claims[token]

    this.setState({
      claims
    })

    localStorage.setItem(LOCAL_STORAGE_CLAIMS, JSON.stringify(claims))
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
    toast.error(err.message)
  }

  handleWarning(msg) {
    console.warn(msg)
    toast.warn(msg)
  }

  render() {
    return (
      <Container className="app-container">
        <CssBaseline />
        {process.env.NODE_ENV !== 'production' ?
          (
            <Header
              network={this.state.network}
              onNetworkChange={this.changeNetwork}
            />
          ) : null}
        <div className="header-pad" />
        <TokenButton onClick={this.click} clicking={this.state.clicking} />
        <TokenBalance
          tokenBalance={this.state.tokenBalance}
          tokens={this.state.clicks}
          toggleRedemption={this.toggleRedemption}
          claims={this.state.claims}
          />
        <Footer toggleFAQ={this.toggleFAQ} toggleDebug={this.toggleDebug} toggleRedemption={this.toggleRedemption} />

        <FAQModal
          className={this.state.showFAQ ? '' : 'hide'}
          toggleFAQ={this.toggleFAQ}
          />

        <DebugModal
          className={this.state.showDebug ? '' : 'hide'}
          toggleDebug={this.toggleDebug}
          network={this.state.network}
          />

        <RedemptionModal
          className={this.state.showRedemption ? '' : 'hide'}
          toggleFAQ={this.toggleRedemption}
          token={this.state.token}
          contract={this.state.contract}
          clicks={this.state.clicks}
          addClaim={this.addClaim}
          removeClaim={this.removeClaim}
          updateBalance={this.updateBalance}
          claims={this.state.claims}
          handleWarning={this.handleWarning}
          handleError={this.handleError}
          network={this.state.network}
          reset={this.reset}
          close={this.closeRedemption}
          />

        <ToastContainer
          position="bottom-right"
          newestOnTop={true}
          autoClose={15000}
          />
      </Container>
    )
  }
}

export default App
