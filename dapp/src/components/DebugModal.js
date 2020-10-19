import React, { useState, useEffect } from 'react'
import { Box, Button, Paper, Typography } from '@material-ui/core'
import { BigNumber } from 'ethers'

import { useStyles } from '../utils/useStyles'
import { ONE_E_18 } from '../utils/bn'
import { getProvider } from '../utils/eth'

import Input from './Input'

const DebugModal = ({ className, network, toggleDebug }) => {
  const classes = useStyles()
  const [grantMessage, setGrantMessage] = useState('')
  const [formValues, setFormValues] = useState({})

  async function grantSigner() {
    const provi = await getProvider(network)
    const address = formValues['signer-address']
    const amount = formValues['signer-amount']
    const realAmount = BigNumber.from(amount).mul(ONE_E_18)
    const tx = await provi.clickToken.grantSigner(address, realAmount)
    setGrantMessage(`txHash: ${tx.hash}`)
  }

  function change(name, val) {
    setFormValues({
      ...formValues,
      [name]: val
    })
  }

  useEffect(() => {
    getProvider(network).then(provi => {
      if (provi.signer) {
        provi.signer.getAddress().then(addr => {
          setFormValues({
            ...formValues,
            ['signer-address']: addr
          })
        })
      }
    })
  })

  return (
    <Box className={`modal-container ${className}`} onClick={(ev) => {
        if (ev.target === ev.currentTarget) {
            toggleDebug(ev)
        }
    }}>
        <Box className={`modal debug-modal`}>
            <Typography variant="h2">Debug</Typography>
            <Paper>
              <Box className={classes.addSignerForm}>
                <Typography variant="h3">Grant Signer</Typography>
                <Typography variant="subtitle1">
                  <label htmlFor="signer-address">Signer</label>
                </Typography>
                <Input
                  name="signer-address"
                  placeholder="0xdeadbeef1234..."
                  set={change}
                  />

                <Typography variant="subtitle1">
                  <label htmlFor="signer-amount">Amount (CLIK)</label>
                </Typography>
                <Input
                  name="signer-amount"
                  placeholder="100000"
                  set={change}
                  />

                <Box className={grantMessage ? `hide` : ''}>
                  {grantMessage}
                </Box>

                <Button variant="contained" color="primary" onClick={grantSigner}>Send</Button>
              </Box>
            </Paper>
        </Box>
    </Box>
  )
}

export default DebugModal
