var _ = require('lodash');
var expect = require('chai').expect;
var fs = require('fs');
var jsoner = require('../lib/index.js');
var tmp = require('tmp');

describe('jsoner.appendFileSync performance tests', function() {
    it('appends 1 million small JSON objects, one by one', function(done) {
        var iterations = 1000000;
        var tmpFilename = tmp.tmpNameSync();

        var start = Date.now();
        fs.writeFileSync(tmpFilename, '[]');
        for (var index = 0; index < iterations; index++) {
            jsoner.appendFileSync(tmpFilename, {
                foo: 'bar',
                index: index
            });
        }
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

    it('appends 1 million small JSON objects, 1024 at a time', function(done) {
        var iterations = 1000000;
        var tmpFilename = tmp.tmpNameSync();
        var objects = [];

        fs.writeFileSync(tmpFilename, '[]');
        var start = Date.now();
        for (var index = 0; index < iterations; index++) {
            objects.push({
                foo: 'bar',
                index: index
            });

            if (objects.length === 1024) {
                jsoner.appendFileSync(tmpFilename, objects);
                objects = [];
            }
        }
        if (objects.length > 0) {
            jsoner.appendFileSync(tmpFilename, objects);
        }
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
        jsoner.appendFileSync(tmpFilename, objects);
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
