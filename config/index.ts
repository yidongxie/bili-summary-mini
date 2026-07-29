import { defineConfig } from '@tarojs/cli';
import path from 'path';

export default defineConfig({
  projectName: 'BiliStudy',
  date: '2026-7-28',
  designWidth: 375,
  deviceRatio: {
    375: 2,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  plugins: [
    '@tarojs/plugin-framework-react',
  ],
  defineConstants: {},
  framework: 'react',
  compiler: 'webpack5',
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: { limit: 1024 },
      },
      cssModules: {
        enable: false,
        config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' },
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: { autoprefixer: { enable: true, config: {} }, cssModules: { enable: false } },
  },
});
