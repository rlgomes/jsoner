var _ = require('underscore');
var expect = require('chai').expect;
var fs = require('fs');
var jsoner = require('../lib/index.js');
var tmp = require('tmp');

describe('jsoner.parse performance tests', function() {

    it('parses a stream with a simple JSON object', function(done) {
        var iterations = 1000000;
        var tmpFilename = tmp.tmpNameSync();
        var objects = [];

        fs.writeFileSync(tmpFilename, '[]');
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
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            var start = Date.now(); 
            jsoner.parse(stream)
            .on('object', function() {
                processed++;
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                var elapsedSeconds = (Date.now() - start) / 1000;
                var objectsPerSecond = Math.round(iterations / elapsedSeconds);
                console.log('objects/second:', objectsPerSecond);
                expect(processed).to.equal(iterations);
                done();
            });
        });
    });
});
