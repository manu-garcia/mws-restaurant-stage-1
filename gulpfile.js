
const gulp = require('gulp');
const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');
const opn = require('opn');
const path = require('path');

const responsive = require('gulp-responsive-images');

// Production
const webpackConfigProduction = require('./webpack.production.config');

// Develompent
const webpackConfigDevelopment = require('./webpack.development.config');
const webpackDevServerConfig = require('./webpack.devserver.config');

/**
 * Build the production bundles.
 */
gulp.task('build', ['responsive-images'], function (callback) {

  var compiler = webpack(webpackConfigProduction, function () {
    callback();
  });

});

/**
 * Task to develop locally, watch + bundeling + hot module replacement
 */
gulp.task('watch', ['responsive-images'], function (callback) {

  webpackDevServer.addDevServerEntrypoints(webpackConfigDevelopment, webpackDevServerConfig);
  var compiler = webpack(webpackConfigDevelopment);

    new webpackDevServer(
      compiler,
      webpackDevServerConfig
    ).listen(webpackDevServerConfig.port, webpackDevServerConfig.host, function (err) {

      if (err) {
        console.log('Error running webpack dev server', err);
        return;
      }

      var uri = 'http://' + webpackDevServerConfig.host + ':' + webpackDevServerConfig.port;

      opn(uri).then(function () {
        console.log('Listening on ' + uri);
      });

    })
});

/**
 * Creates different image sizes from the original images
 */
gulp.task('responsive-images', function () {
  gulp.src('./img/**/*')
  .pipe(responsive({
    '*.jpg': [{
      width: 320,
      suffix: '-320'
    }, {
      width: 640,
      suffix: '-640'
    }, {
      width: 800,
      suffix: '-800'
    }],
  }))
  .pipe(gulp.dest('build/img'));
});