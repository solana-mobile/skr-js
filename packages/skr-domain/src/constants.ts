import { address, type Address } from '@solana/kit'

/** AllDomains name service program. */
export const ANS_PROGRAM_ADDRESS: Address = address('ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK')

/** Root name account of the AllDomains name service. */
export const ANS_ROOT: Address = address('3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU')

/** AllDomains Name House program, which wraps names as NFTs. */
export const NAME_HOUSE_PROGRAM_ADDRESS: Address = address('NH3uX6FtVE2fNREAioP7hm5RaozotZxeL6khU1EHx51')

/** Parent name account of every `.skr` name. */
export const SKR_PARENT: Address = address('F3A8kuikEiu6k2399oSJ1PWfcJYDHqpwoQ2e8psSDNuF')

/** TLD House account of the `.skr` top-level domain. */
export const SKR_TLD_HOUSE: Address = address('4RKP4BEMu5sXBfXSH7xN2owtQrnAJvhhwtBBmj9JEYkA')

/** AllDomains TLD House program, which owns TLD and main-domain accounts. */
export const TLD_HOUSE_PROGRAM_ADDRESS: Address = address('TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S')
