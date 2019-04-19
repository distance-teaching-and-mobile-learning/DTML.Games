process.traceDeprecation = true
var path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var BrowserSyncPlugin = require('browser-sync-webpack-plugin')

// Phaser webpack config
var dtml = path.join(__dirname, '/../node_modules/dtml.sdk')
var joint = path.join(__dirname, '/../node_modules/jointjs')
var jquery = path.join(__dirname, '/../node_modules/jquery')

module.exports = {
  entry: {
    app: [
      '@babel/polyfill',
      path.resolve(__dirname, 'dialogger.js')
    ],
    vendor: ['dtml', 'joint']
  },
  devtool: 'cheap-source-map',
  mode: 'development',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'build'),
    publicPath: './',
    filename: '[name].js'
  },
  watch: true,
  optimization: {
    namedModules: false,
    runtimeChunk: false,
    concatenateModules: false
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: path.join(__dirname, '/build/index.html'),
      template: path.join(__dirname, '/index.html'),
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual',
      minify: {
        removeAttributeQuotes: false,
        collapseWhitespace: false,
        html5: false,
        minifyCSS: false,
        minifyJS: false,
        minifyURLs: false,
        removeComments: false,
        removeEmptyAttributes: false
      },
      hash: false
    }),
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 3000,
      server: {
        baseDir: [path.resolve(__dirname, 'build')]
      }
    })
  ],
  module: {
    rules: [
      { test: /\.js$/, use: ['babel-loader'], include: __dirname },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /dtml-sdk\.js/, use: ['expose-loader?dtml'] },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader'
      },
      {
        test: require.resolve('jointjs'),
        use: ['expose-loader?joint']
      },
      {
        test: require.resolve('jquery'),
        use: ['expose-loader?$']
      }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  resolve: {
    alias: {
      'dtml': dtml,
      'joint': joint,
      '$': jquery
    }
  }
}
