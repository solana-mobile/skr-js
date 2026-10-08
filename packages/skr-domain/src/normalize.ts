const SKR_SUFFIX = '.skr'

/**
 * Returns the bare lowercase label of a `.skr` name: `'Alice.skr'` and `' alice '` both become
 * `'alice'`. Throws a plain `Error` when the result is empty or still contains a dot, so subdomains,
 * other TLDs and doubled suffixes such as `'alice.skr.skr'` are rejected.
 */
export function normalizeSkrName(input: string): string {
  if (typeof input !== 'string') {
    throw new Error(`name must be a string, got ${String(input)}`)
  }
  let label = input.trim().toLowerCase()
  if (label.endsWith(SKR_SUFFIX)) {
    label = label.slice(0, -SKR_SUFFIX.length)
  }
  if (label.length === 0) {
    throw new Error(`name must not be empty, got ${JSON.stringify(input)}`)
  }
  if (label.includes('.')) {
    throw new Error(`name must be a single .skr label without dots, got ${JSON.stringify(input)}`)
  }
  return label
}
