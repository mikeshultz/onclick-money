export function require(v, msg = "Invalid input") {
  if (!v) throw new Error(msg)
  return v
}
