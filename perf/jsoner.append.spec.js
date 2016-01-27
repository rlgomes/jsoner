var expect = require('chai').expect;
var fs = require('fs');
var jsoner = require('../lib/index.js');
var tmp = require('tmp');

describe('jsoner.appendFile performance tests', function() {

    it('appends 50,000 small JSON objects, one by one', function(done) {
        var iterations = 50000;
        var tmpFilename = tmp.tmpNameSync();

        var start = Date.now();
        fs.writeFileSync(tmpFilename, '[]');

        function loop(current, length) {
            if (current == length) {
                return Promise.resolve();
            } else {
                return jsoner.appendFile(tmpFilename, {
                    foo: 'bar',
                    index: current
                })
                .then(function() {
                    return loop(current + 1, length);
                });
            }
        }

        loop(0, iterations)
        .then(function() {
            var elapsedSeconds = (Date.now() - start) / 1000;
            var appendsPerSecond = Math.round(iterations / elapsedSeconds);
            console.log('appends/second:', appendsPerSecond);
        })
        .then(function() {
            // Verify the correctness of the previous writes
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('end', function() {
                expect(processed).to.equal(iterations);
                done();
                fs.unlinkSync(tmpFilename);
            })
            .on('error', function(err) {
                done(err);
            });
        });
    });

    it('appends 1 million small JSON objects, 1024 at a time', function(done) {
        var iterations = 1000000;
        var tmpFilename = tmp.tmpNameSync();
        var objects = [];

        fs.writeFileSync(tmpFilename, '[]');
        var start = Date.now();
        var base = Promise.resolve();

        for (var index = 0; index < iterations; index++) {
            objects.push({
                foo: 'bar',
                index: index
            });

            if (objects.length === 1024) {
                base = base.then(function() {
                    var buffer = objects;
                    objects = [];
                    return jsoner.appendFile(tmpFilename, buffer);
                });
            }
        }

        if (objects.length > 0) {
            base = base.then(function() {
                return jsoner.appendFile(tmpFilename, objects);
            });
        }

        base
        .then(function() {
            var elapsedSeconds = (Date.now() - start) / 1000;
            var appendsPerSecond = Math.round(iterations / elapsedSeconds);
            console.log('appends/second:', appendsPerSecond);
        })
        .then(function() {
            // Verify the correctness of the previous writes
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('end', function() {
                expect(processed).to.equal(iterations);
                done();
                fs.unlinkSync(tmpFilename);
            })
            .on('error', function(err) {
                done(err);
            });
        });
    });

    it('appends 1 million small JSON objects, all at once', function(done) {
        var iterations = 1000000;
        var tmpFilename = tmp.tmpNameSync();
        var objects = [];

        fs.writeFileSync(tmpFilename, '[]');
        for (var index = 0; index < iterations; index++) {
            objects.push({
                foo: 'bar',
                index: index
            });
        }
        var start = Date.now();
        jsoner.appendFile(tmpFilename, objects)
        .then(function() {
            var elapsedSeconds = (Date.now() - start) / 1000;
            var appendsPerSecond = Math.round(iterations / elapsedSeconds);
            console.log('appends/second:', appendsPerSecond);

            // Verify the correctness of the previous writes
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('end', function() {
                expect(processed).to.equal(iterations);
                done();
                fs.unlinkSync(tmpFilename);
            })
            .on('error', function(err) {
                done(err);
            });
        });
    });
});
