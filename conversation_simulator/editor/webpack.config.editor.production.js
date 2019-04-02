process.traceDeprecation = true
var path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CleanWebpackPlugin = require('clean-webpack-plugin')

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
  mode: 'production',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: '[name].js'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      filename: path.join(__dirname, '/dist/index.html'),
      template: path.join(__dirname, '/index.html'),
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual',
      minify: {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeComments: true,
        removeEmptyAttributes: true
      },
      hash: false
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
