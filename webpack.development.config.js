
const merge = require('webpack-merge');
const common = require('./webpack.common.config');

module.exports = merge(common, {

    // Hot Module Replacement complains about using chunkhash, and recommended to use hash instead
    output : {
        filename : '[name].[hash:8].js'
    },
    devtool: 'inline-source-map',
    plugins: [
        // webpackConfigProduction.plugins.push( new webpack.HotModuleReplacementPlugin() );
        // webpackConfigProduction.plugins.push( new webpack.NamedModulesPlugin() );
    ]

});
