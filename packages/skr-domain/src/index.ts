export {
  ANS_PROGRAM_ADDRESS,
  ANS_ROOT,
  NAME_HOUSE_PROGRAM_ADDRESS,
  SKR_PARENT,
  SKR_TLD_HOUSE,
  TLD_HOUSE_PROGRAM_ADDRESS,
} from './constants.ts'
export { decodeMainDomain, decodeNameRecordHeader } from './decode.ts'
export { getSkrNameAddress } from './derive.ts'
export { getPrimarySkrDomain } from './get-primary-skr-domain.ts'
export { normalizeSkrName } from './normalize.ts'
export { resolveSkrDomain } from './resolve-skr-domain.ts'
export type { MainDomain, NameRecordHeader, SkrDomain, SkrDomainConfig } from './types.ts'
