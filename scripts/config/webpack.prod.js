const { resolve } = require('node:path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const glob = require('glob');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const common = require('./webpack.common');
const { PROJECT_PATH } = require('../constant');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          context: resolve(PROJECT_PATH, './static'),
          from: '*',
          to: resolve(PROJECT_PATH, './dist/static'),
          toType: 'dir',
        },
      ],
    }),
    new PurgeCSSPlugin({
      paths: glob.sync(`${resolve(PROJECT_PATH, './src')}/**/*.{tsx,scss,less,css}`, { nodir: true }),
      whitelist: ['html', 'body'],
    }),
    new webpack.BannerPlugin({
      raw: true,
      banner:
        '/** @preserve Powered by react-ts-quick-starter (https://github.com/vortesnail/react-ts-quick-starter) */',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static', // server: 开一个本地服务查看报告, static 本地html文件, json json数据
      analyzerHost: '127.0.0.1', // host 设置
      analyzerPort: 8888, // 端口号设置
    }),
  ],
});
