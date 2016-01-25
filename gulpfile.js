var coveralls = require('gulp-coveralls');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

var srcFiles = [
    'gulpfile.js',
    'test/**/*.js',
    'lib/**/*.js'
];

gulp.task('lint', function() {
    return gulp.src(srcFiles)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError());
});

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
                statements: 98,
                branches: 95,
                functions: 100,
                lines: 98
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
