const { remove0xPrefix } = require('./hex')
const { SIGNER_URL } = process.env

export async function getClaim(token, recipient, contract) {
  if (!token || !recipient || !contract) {
    console.warn('Missing argument(s) to getClaim')
    return null
  }

  const url = `${SIGNER_URL}/claim`
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      token,
      recipient,
      contract,
    })
  })

  if (!resp.ok) {
    throw new Error(`Failed to fetch.  Return code ${resp.status} from ${url}`)
  }

  return await resp.json()
}

function objectToBase64(o) {
  return btoa(JSON.stringify(o))
}

function base64ToObject(b) {
  return JSON.parse(atob(b))
}

export function packClaim({ token, claim, clicks, contract, signature }) {
  return objectToBase64({ token, claim, clicks, contract, signature })
}

export function unpackClaim(packedClaim) {
  return base64ToObject(packedClaim)
}
