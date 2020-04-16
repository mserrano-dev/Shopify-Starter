const { watch, src, dest, parallel } = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const touch = require('gulp-touch-fd');
const sass = require('gulp-sass');
const globImporter = require('node-sass-glob-importer');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const argv = require('yargs').argv;
//
const env = {
  production: (argv.env == 'production'),
  development: (argv.env == 'development'),
};
let project = null;
update_project_vars();

function update_project_vars() {
  delete require.cache[require.resolve('./gulpfile-vars')];
  project = require('./gulpfile-vars');
}

function css() {
  update_project_vars();
  return src(project.styles.sass_entry)
    .pipe(gulpif(env.development, sourcemaps.init()))
      .pipe(sass({
        importer: globImporter()
      })).on('error', sass.logError)
      .pipe(cssnano())
      .pipe(rename(project.styles.filename))
    .pipe(gulpif(env.development, sourcemaps.write()))
    .pipe(dest(project.asset_folder))
    .pipe(touch()) /* 
      Gulp4 does not update mtime so we do it manually with touch.
      ThemeKit will upload once file mtime is updated.

      https://github.com/gulpjs/gulp/issues/2193
      https://github.com/Shopify/themekit/issues/607
    */
}

function js() {
  update_project_vars();
  return src(project.scripts.source, { sourcemaps: env.development })
    .pipe(concat(project.scripts.filename))
    .pipe(gulpif(env.production, uglify()))
    .pipe(dest(project.asset_folder, { sourcemaps: env.development }))
}

exports.js = (env.production ? js : watch(project.scripts.to_watch, js));
exports.css = (env.production ? css : watch(project.styles.to_watch, css));
exports.default = parallel(css, js);