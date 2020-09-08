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

export function combineClaim(claimHash, signature) {
  return `${claimHash}${signature.slice(2)}`
}
