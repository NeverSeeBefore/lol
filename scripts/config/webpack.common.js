const { resolve } = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const postCssFlexBugsFixes = require('postcss-flexbugs-fixes');
const postCssNormalize = require('postcss-normalize');
const Webpackbar = require('webpackbar');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const { isDev, PROJECT_PATH } = require('../constant');

const getCssLoaders = (importLoaders) => [
  isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
  {
    loader: 'css-loader',
    options: {
      // modules 默认就是 false, 若要开启，可在官网具体查看可配置项
      // TODO: 区分依赖包、全局样式、
      modules: {
        auto: true, // 为/\.module\.\w+$/i.test(filename) 和 /\.icss\.\w+$/i.test(filename) 正则表达式的文件启用 CSS 模块。
        localIdentName: isDev ? '[local]_[hash:base64:5]' : '[hash:base64]',
      },
      sourceMap: isDev, // 开启后与 devtool 设置一致, 开发环境开启，生产环境关闭
      importLoaders, // 指定在 CSS loader 处理前使用的 laoder 数量
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      sourceMap: isDev,
      postcssOptions: {
        plugins: [
          // 修复一些和 flex 布局相关的 bug
          postCssFlexBugsFixes,
          [
            'postcss-preset-env',
            {
              autoprefixer: {
                grid: true,
                flexbox: 'no-2009',
              },
              stage: 3,
            },
          ],
          [
            postCssNormalize().postcssPlugin,
            {
              // forceImport: 'normalize.css',
            },
          ],
        ],
      },
    },
  },
];

module.exports = {
  entry: {
    index: resolve(PROJECT_PATH, './src/index.tsx'),
  },
  output: {
    filename: `js/[name]${isDev ? '' : '.[hash:8]'}.js`,
    path: resolve(PROJECT_PATH, './dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: getCssLoaders(1),
      },
      {
        test: /\.less$/,
        use: [
          ...getCssLoaders(2),
          {
            loader: 'less-loader',
            options: {
              sourceMap: isDev,
            },
          },
        ],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10 * 1024,
              name: '[name].[contenthash:8].[ext]',
              outputPath: 'assets/images',
            },
          },
        ],
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: '[name].[contenthash:8].[ext]',
              outputPath: 'assets/fonts',
            },
          },
        ],
      },
      {
        test: /\.(tsx?|js)$/,
        loader: 'babel-loader',
        options: { cacheDirectory: true },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve(PROJECT_PATH, './public/index.html'),
      filename: 'index.html',
      cache: false,
      minify: isDev
        ? false
        : {
            removeAttributeQuotes: true,
            collapseWhitespace: true,
            removeComments: true,
            collapseBooleanAttributes: true,
            collapseInlineTagWhitespace: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
            useShortDoctype: true,
          },
    }),
    new Webpackbar({
      name: isDev ? '正在启动' : '正在打包',
      color: '#fa8c16',
    }),
    // 编译ts时，babel的操作时直接去掉类型检查，所以即使类型报错，也可以正常打包
    // ForkTsCheckerWebpackPlugin 可以检查类型给出提示(不会打断打包)
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: resolve(PROJECT_PATH, './tsconfig.json'),
      },
    }),
    ...(isDev ? [] : [new MiniCssExtractPlugin()]),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '...'],
    alias: {
      Src: resolve(PROJECT_PATH, './src'),
      Components: resolve(PROJECT_PATH, './src/components'),
      Utils: resolve(PROJECT_PATH, './src/utils'),
      Static: resolve(PROJECT_PATH, './src/static'),
    },
  },
  // 外部cdn引入
  // externals: {
  //   react: 'React',
  //   'react-dom': 'ReactDOM',
  // },
  optimization: {
    minimize: !isDev,
    minimizer: [
      !isDev &&
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: { pure_funcs: ['console.log'] },
          },
        }),
      !isDev && new OptimizeCssAssetsPlugin(),
    ].filter(Boolean),
    splitChunks: {
      // ...
    },
  },
};
