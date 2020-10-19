import React from 'react'
import { Button } from '@material-ui/core'

import './TokenButton.css'

const TokenButton = (props) => {
  return (
    <Button variant="contained" color="primary" className={`token`} onClick={props.onClick}>{
        props.clicking ?
            <div className="loader loader-large" /> :
            <>Click</>
    }</Button>
  )
}

export default TokenButton
