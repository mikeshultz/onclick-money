
export function newWindow(ev) {
    ev.preventDefault()
    window.open(ev.target.href)
}
