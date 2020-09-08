const { SIGNER_URL } = process.env

export async function getClicks(token) {
  if (!token) {
    return null
  }

  const url = `${SIGNER_URL}/clicks/${token}`
  const resp = await fetch(url)

  if (!resp.ok) {
    throw new Error(`Failed to fetch.  Return code ${resp.status} from ${url}`)
  }

  return await resp.json()
}
 
export async function sendClick(token) {
  const url = `${SIGNER_URL}/click`
  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      token
    })
  })

  if (!resp.ok) {
    throw new Error(`Failed to fetch.  Return code ${resp.status} from ${url}`)
  }

  return await resp.json()
}
