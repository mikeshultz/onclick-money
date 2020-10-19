import { BigNumber } from 'ethers'

export const ONE_E_18 = BigNumber.from('1000000000000000000')

const ZERO_PATTERN = /^[0]+$/
const ZERO_END_PATTERN = /([0]+)$/

function allZeros(v) {
  return v.match(ZERO_PATTERN) !== null
}

function trimZeros(v) {
  return v.replace(ZERO_END_PATTERN, '')
}

export function bnToString(b) {
  return b.toString()
}

export function bnToDecimalString(v, decimals=18) {
  const vs = bnToString(v)
  console.log('vs:', vs)
  if (vs === '0') {
    return '0'
  }
  if (vs.length < decimals) {
    return `0.${vs.padStart(decimals, '0')}`
  }
  const split = vs.length - decimals
  const integral = vs.substring(0, split)
  const fractional = vs.substring(split, vs.length)
  if (allZeros(fractional)) {
    return integral
  }
  return `${integral}.${trimZeros(fractional)}`
}
