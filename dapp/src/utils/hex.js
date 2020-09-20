export function truncateToken(tok) {
  return `${tok.slice(0,5)}...${tok.slice(tok.length - 5, tok.length)}`
}

export function add0xPrefix(v) {
  if (v.startsWith('0x')) {
    return v
  }
  return `0x${v}`
}

export function remove0xPrefix(v) {
  if (v.startsWith('0x')) {
    return v.slice(2)
  }
  return v
}
