import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import  { viteSingleFile } from 'vite-plugin-singlefile'
export default defineConfig({
  plugins: [solid(),tailwindcss(),viteSingleFile()],
    build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // 非常に大きく設定してすべてインライン化
  }
})
