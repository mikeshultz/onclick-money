import React from 'react'

import './FAQModal.css'

const FAQModal = (props) => {
  return (
    <div className={`modal-container ${props.className}`} onClick={(ev) => {
        if (ev.target === ev.currentTarget) {
            props.toggleFAQ(ev)
        }
    }}>
        <div className={`modal faq-modal`}>
            <h2>Frequently Asked Questions</h2>
            <dl>
                <dt>How do I get the tokens in my wallet?</dt>
                <dd>
                    When you're done your session of clicking, you need to go
                    through the redemption process.  This involves generating a
                    claim and sending it to the token contract.
                </dd>

                <dt>Why do I have to send the claim?</dt>
                <dd>
                    Have you seen the recent gas prices? The claims do not
                    expire, so you can send them whenever prices fit your
                    budget.
                </dd>

                <dt>Is the circulating supply fixed?</dt>
                <dd>Nope.  Every claim mints new tokens.</dd>

                <dt>Can I exchange CLIK tokens for money?</dt>
                <dd>If someone's willing to pay for them, sure, why not.</dd>
            </dl>
        </div>
    </div>
  )
}

export default FAQModal
