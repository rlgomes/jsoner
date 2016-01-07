var _ = require('lodash');
var expect = require('chai').expect;
var fs = require('fs');
var jsoner = require('../lib/index.js');
var tmp = require('tmp');

describe('jsoner', function() {

    var tmpFilename;

    beforeEach(function() {
        tmpFilename = tmp.tmpNameSync();
    });

    afterEach(function() {
        try {
            fs.unlinkSync(tmpFilename);
        } catch (err) {
            // Best effort clean up
        }
    });

    describe('.appendFileSync', function() {
        it('fails to append to a file in an inexistent file', function() {
            expect(function() {
                jsoner.appendFileSync(tmpFilename, {});
            }).to.throw('ENOENT: no such file or directory');
        });

        it('fails to append to a file in an inexistent path', function() {
            expect(function() {
                jsoner.appendFileSync('/no/mans/land/foo.juttle', {});
            }).to.throw('ENOENT: no such file or directory');
        });

        it('fails to append an object to an incomplete JSON array', function() {
            fs.writeFileSync(tmpFilename, '[ ');
            expect(function() {
                jsoner.appendFileSync(tmpFilename, {});
            }).to.throw('not a valid JSON format');
        });

        it('appends a JSON object to an empty file', function() {
            var object = { foo: 'bar' };
            fs.writeFileSync(tmpFilename, '');
            jsoner.appendFileSync(tmpFilename, object);
            var data = fs.readFileSync(tmpFilename);
            expect(JSON.parse(data.toString())).to.deep.equal([object]);
        });

        it('appends a JSON object to a file full of whitespace', function() {
            var object = { foo: 'bar' };
            fs.writeFileSync(tmpFilename, _.pad('', 4096, ' '));
            jsoner.appendFileSync(tmpFilename, object);
            var data = fs.readFileSync(tmpFilename);
            expect(JSON.parse(data.toString())).to.deep.equal([object]);
        });

        it('appends a JSON object to an empty JSON array', function() {
            var object = { foo: 'bar' };
            fs.writeFileSync(tmpFilename, '[]');
            jsoner.appendFileSync(tmpFilename, object);
            var data = fs.readFileSync(tmpFilename);
            expect(JSON.parse(data.toString())).to.deep.equal([object]);
        });

        it('appends multiple JSON objects at once', function(done) {
            var objects = [];
            for (var index = 0; index < 1024; index++) {
                objects.push({
                    foo: 'bar',
                    index: index
                });
            }
            fs.writeFileSync(tmpFilename, '[]');
            jsoner.appendFileSync(tmpFilename, objects);
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('end', function() {
                expect(processed).to.equal(1024);
                done();
            })
            .on('error', function(err) {
                done(err);
            });
        });

        it('appends multiple JSON objects one by one', function(done) {
            var objects = [];
            for (var index = 0; index < 1024; index++) {
                objects.push({
                    foo: 'bar',
                    index: index
                });
            }
            fs.writeFileSync(tmpFilename, '[]');
            _.each(objects, function(object) {
                jsoner.appendFileSync(tmpFilename, object);
            });
            var stream = fs.createReadStream(tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('end', function() {
                expect(processed).to.equal(1024);
                done();
            })
            .on('error', function(err) {
                done(err);
            });
        });
    });
});
