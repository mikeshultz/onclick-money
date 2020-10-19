import React from 'react'
import { Box, Button, Grid } from '@material-ui/core'
import { TouchApp, Receipt, Money } from '@material-ui/icons'

import { bnToDecimalString } from '../utils/bn'

import PrimaryCard from './PrimaryCard'

import './TokenBalance.css'

const TokenBalance = (props) => {
  const pendingClaims = !!props.claims ? Object.keys(props.claims).length : 0
  const decimalBalance = bnToDecimalString(props.tokenBalance)
  const displayBalance = decimalBalance !== '0'
  const mdw = displayBalance ? 4 : 6

  return (
    <Box className="token-balance">
      <Grid container spacing={3}>
        <Grid item md={mdw} xs={12}>
          <PrimaryCard
            onClick={props.toggleRedemption}
            head={
              <>
                <TouchApp /> Earned
              </>
            }
            detail={<>{props.tokens} CLIK</>}
          />
        </Grid>

        <Grid item md={mdw} xs={12}>
          <PrimaryCard
            onClick={props.toggleRedemption}
            head={
              <>
                <Receipt /> Claims
              </>
            }
            detail={pendingClaims}
          />
        </Grid>

        {displayBalance ? (
          <Grid item md={mdw} xs={12}>
            <PrimaryCard
              head={
                <>
                  <Money /> Balance
                </>
              }
              detail={<>{decimalBalance} CLIK</>}
            />
          </Grid>
        ) : null}

        <Grid item xs={12}>
          <p>
            You can
            <Button
              variant="outlined"
              size="small"
              color="primary"
              className="redeem"
              onClick={props.toggleRedemption}
            >
              redeem
            </Button>
            them when you\'re ready.
          </p>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TokenBalance
