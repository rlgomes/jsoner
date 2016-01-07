var coveralls = require('gulp-coveralls');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var mocha = require('gulp-mocha');

var srcFiles = [
    'gulpfile.js',
    'test/**/*.js',
    'lib/**/*.js'
];

gulp.task('jscs', function() {
    return gulp.src(srcFiles)
    .pipe(jscs({
        configPath: '.jscsrc'
    }))
    .pipe(jscs.reporter('unix'))
    .pipe(jscs.reporter('fail'));
});

gulp.task('jshint', function() {
    return gulp.src(srcFiles)
    .pipe(jshint('./test/.jshintrc'))
    .pipe(jshint.reporter('default', { verbose: true }))
    .pipe(jshint.reporter('fail'));
});

gulp.task('lint', ['jscs', 'jshint']);

gulp.task('instrument', function() {
    return gulp.src('lib/**/*.js')
    .pipe(istanbul({
        includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

function gulpTest() {
    return gulp.src('test/**/*.spec.js')
    .pipe(mocha({
        log: true,
        timeout: 2000,
        slow: 1000,
        reporter: 'spec',
        ui: 'bdd'
    }));
}

gulp.task('test', function() {
    return gulpTest();
});

gulp.task('coverage', ['instrument'], function() {
    return gulpTest()
    .pipe(istanbul.writeReports())
    .pipe(istanbul.enforceThresholds({
        thresholds: {
            global: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100
            }
        }
    }));
});

gulp.task('coveralls', function() {
    gulp.src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('perf', function() {
    return gulp.src('perf/**/*.spec.js')
    .pipe(mocha({
        log: true,
        timeout: 60000,
        slow: 30000,
        reporter: 'spec',
        ui: 'bdd'
    }));
});
