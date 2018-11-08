const path = require('path')
const webpack = require('webpack')
const packageJson = require('./package.json')

// webpack plugin
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'
const isPro = process.env.NODE_ENV === 'production'
const cssIdentifier = isPro ? '[hash:base64:10]' : 'wechat_h5_video__[local]'

const config = {
  mode: 'none',
  entry: path.resolve('src', 'index.js'),

  output: {
    path: isDev
      ? path.resolve('dist')
      : path.resolve('build'),
    filename: isPro
      ? 'wechatH5Video.min.js'
      : 'wechatH5Video.js',
    library: 'wechatH5Video',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },

  resolve: {
    modules: [
      path.resolve('src'),
      path.resolve('node_modules')
    ],
    'extensions': ['.js']
  },

  module: {
    rules: [
      // Scripts
      {
        test: /\.js$/,
        type: 'javascript/auto',
        include: [
          path.resolve('src'),
        ],
        exclude: [
          path.resolve('node_modules'),
        ],
        loader: 'babel-loader'
      },

      // Style
      {
        test: /\.css$/,
        exclude: [
          path.resolve('node_modules'),
        ],
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: true,
              localIdentName: cssIdentifier,
            },
          }
        ]
      }
    ]
  },

  plugins: []
};

// dev mode
if (isDev) {
  config.mode = 'development';

  // devtool
  config.devtool = 'source-map';

  config.plugins.push(
    new HtmlWebpackPlugin({
      inject: false,
      template: path.resolve('./demo', 'index.html'),
    }),

    new CleanWebpackPlugin(['dist'], {
      root: path.resolve('./'),
      verbose: true,
      dry: false
    }),

    new BrowserSyncPlugin({
      server: {
        baseDir: 'dist',
      },
    }, {
        reload: true,
      })
  );
}

// production mode
if (isPro) {
  config.mode = 'production';

  config.plugins.push(
    new webpack.HashedModuleIdsPlugin(),

    new CleanWebpackPlugin(['build'], {
      root: path.resolve('./'),
      verbose: true,
      dry: false
    })
  );

  config.optimization = {
    minimizer: [
      // Uglify Js
      new UglifyJsPlugin({
        uglifyOptions: {
          ie8: false,
          safari10: true,
          ecma: 5,
          output: {
            comments: /^!/,
            beautify: false
          },
          compress: {
            warnings: false,
            drop_debugger: true,
            drop_console: true,
            collapse_vars: true,
            reduce_vars: true
          },
          warnings: false,
          sourceMap: true
        }
      }),
    ]
  };
}

module.exports = config;
