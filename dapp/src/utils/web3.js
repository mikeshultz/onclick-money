export const DEFAULT_NETWORK = 4
export const NETWORKS = {
  '4': 'rikeby',
  '1599365991490': 'dev'
}
export const CONTRACTS = {
  '1599365991490': '0x1eAE8a37314B3A8371C9714606a3bA2f2d9d3EbC'
}
export const NET_BY_CONTRACT = Object.keys(
  CONTRACTS
).reduce((acc, cur) => {
  console.log(`acc[${CONTRACTS[cur]}] = ${cur}`)
  acc[CONTRACTS[cur]] = cur
  return acc
}, {})
