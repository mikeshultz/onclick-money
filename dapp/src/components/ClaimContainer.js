import React, { useState } from 'react'

import './ClaimContainer.css'

const Copied = (props) => {
  const { top, left, hide, timeout = 3000 } = props

  if (hide) {
    setTimeout(() => {
      hide()
    }, timeout)
  }

  return (
    <div className="copied" style={{
      top,
      left,
    }}>
      Copied!
    </div>
  )
}

const ClaimContainer = (props) => {
  const { claim } = props
  const [showCopied, setShowCopied] = useState(false)

  const highlight = (ev) => {
    const node = ev.target

    if (document.body.createTextRange) {
        const range = document.body.createTextRange()
        range.moveToElementText(node)
        range.select()
        document.execCommand('copy')
        setShowCopied(true)
    } else if (window.getSelection) {
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(node)
        selection.removeAllRanges()
        selection.addRange(range)
        document.execCommand('copy')
        setShowCopied(true)
    }
  }

  //const rect = .getBoundingClientRect

  return (
    <div className="packed-claim" onClick={highlight}>
      {claim}
      {showCopied ? (
        <Copied
          hide={() => { setShowCopied(false) }}
          />
        ) : (
          null
        )
      }
    </div>
  )
}

export default ClaimContainer
