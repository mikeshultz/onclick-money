export function truncateToken(tok) {
    return `${tok.slice(0,5)}...${tok.slice(tok.length - 5, tok.length)}`
}
