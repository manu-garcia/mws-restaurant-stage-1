const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const InterpolateSWPlugin = require('interpolate-sw-plugin');

var webpackConfigProduction = require('./webpack.production.config');

// Override as necesary

// TODO: Deactivate minification

// Hot Module Replacement complains about using chunkhash, and recommended to use hash instead
webpackConfigProduction.output.filename = '[name].[hash:8].js';

// Activates hot module replacement
// webpackConfigProduction.plugins.push( new webpack.HotModuleReplacementPlugin() );
// webpackConfigProduction.plugins.push( new webpack.NamedModulesPlugin() );

module.exports = webpackConfigProduction;
