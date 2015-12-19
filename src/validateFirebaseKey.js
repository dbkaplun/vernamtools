// Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
export const VALID_FIREBASE_KEY_RE = /^[^.#$\/\[\]]+$/
export default function (key) {
  return key.match(VALID_FIREBASE_KEY_RE)
}
