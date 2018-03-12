
const webpack = require('webpack');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const common = require('./webpack.common.config');

module.exports = merge(common, {

  plugins: [

    // Clean build directory before each new build
    new CleanWebpackPlugin(['build']),

    // Minifies JS
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    
  ]
});
