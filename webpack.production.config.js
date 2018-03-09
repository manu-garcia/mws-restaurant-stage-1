const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InterpolateSWPlugin = require('interpolate-sw-plugin');

// const env = require('./env.production');

// TODO: That should be based on prod/dev
const minifyHTMLOptions = {
  removeComments: true,
  collapseWhitespace: true,
  minifyJS: true,
};

module.exports = {
  entry: {
    // 'dbhelper': './js/dbhelper.js',
    'main': './js/main.js',
    'restaurant_info': './js/restaurant_info.js',
  },
  output: {
    path: path.resolve(__dirname, './build'),

    // Main bundle names
    filename: '[name].[chunkhash:8].js',
    // For dynamic imports (Lazy load). Webpack comment on import call
    chunkFilename: '[name].[chunkhash:8].chunk.js',

    libraryTarget: 'var',
    // library: ["Restaurants", "[name]"]
    library: "[name]"
  },
  module: {
    // noParse: /index.js/,
    // noParse: /node_modules\/localforage\/dist\/localforage.js/,
    loaders: [
      {
        test: require.resolve('./js/main'),
        loader: 'imports-loader?this=>window'
      },
      {
        test: require.resolve('./js/restaurant_info'),
        loader: 'imports-loader?this=>window'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        }
      },
      // Build a separated css bundle
      {
        test: /\.(s*)css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{ loader: 'css-loader', options: { minimize: true }}, 'sass-loader']
        })
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  plugins: [

    // Clean build directory before each new build
    new CleanWebpackPlugin(['build']),

    // Extract all the common js code to a separated chunk
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "commons.[hash:8].js",
    }),

    // Extract all common css to a separate file
    new ExtractTextPlugin("styles.[hash:8].css"),

    // Minifies JS
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    
    // Copy the html templates and inject the bundles
    new HtmlWebpackPlugin({
      // Tempalte to use
      template: './index.html',
      // Filename to give
      filename: 'index.html',
      chunks: ['commons', 'styles', 'main'],
      minify: minifyHTMLOptions
    }),

    new HtmlWebpackPlugin({
      template: './restaurant.html',
      filename: 'restaurant.html',
      chunks: ['commons', 'styles', 'restaurant_info'],
      minify: minifyHTMLOptions
    }),

    // Copy the service worker as it is to the build folder
    new CopyWebpackPlugin([
      // TODO: Data should be in DB not in a file
      { from: './data/', to: './data/' },
      // TODO: Images need to be prepared for web
      { from: './img/', to: './img/' },
    ]),

    // Copy the service worker and inject in it the list of assets for pre-cache and cache version
    // Notice runing this plugin after CopyWebpackPlugin will include copied files too
    // new InterpolateSWPlugin({
    //   from: './public/sw.js',
    //   to: 'sw.js',
    //   replaceCacheVersion: true,
    //   replaceAssetFiles: true,
    // }),

  ]
};
