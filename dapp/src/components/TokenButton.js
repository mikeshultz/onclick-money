import React from 'react'

import './TokenButton.css'

const TokenButton = (props) => {
  return (
    <button className={`token`} onClick={props.onClick}>{
        props.clicking ?
            <div className="loader loader-large" /> :
            <>Click</>
    }</button>
  )
}

export default TokenButton
