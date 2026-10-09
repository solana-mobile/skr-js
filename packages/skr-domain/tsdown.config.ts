import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'neutral',
  sourcemap: true,
})

export default config
