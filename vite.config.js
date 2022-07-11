import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const path = require('path')
import autoprefixer from 'autoprefixer'
import pxToUnit from 'postcss-px-to-relative-unit'

export default defineConfig({
  plugins: [
    vue(),
  ],

  css: {
    postcss: {
      plugins: [
        autoprefixer({}),
        pxToUnit({
          targetUnit: "vw",
          ignoreThreshold: 1,
          viewportWidth: 750,
          viewportHeight: 1334,
          htmlFontSize: 37.5,
          unitPrecision: 5,
          excludeFiles: [],
          excludeSelectors: [],
          excludeProperties: [],
        }),
      ]
    }
  },

  base: './',
  
  // 配置文件别名 vite1.0是/@/  2.0改为/@
  // 这里是将src目录配置别名为 /@ 方便在项目中导入src目录下的文件
  resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
  },

})
