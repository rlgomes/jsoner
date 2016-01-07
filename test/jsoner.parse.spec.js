var _ = require('lodash');
var expect = require('chai').expect;
var fs = require('fs');
var jsoner = require('../lib/index.js');
var tmp = require('tmp');

describe('jsoner', function() {

    beforeEach(function() {
        this.tmpFilename = tmp.tmpNameSync();
    });

    afterEach(function() {
        fs.unlinkSync(this.tmpFilename);
    });

    describe('.parse', function() {
        it('fails to parse a non stream object', function(done) {
            fs.writeFileSync(this.tmpFilename, '[ ');
            expect(function() {
                jsoner.parse(undefined)
                .on('object', function(object) {
                    done(Error('Unexpected object ' + object));
                })
                .on('error', function(err) {
                    done(err);
                });
            }).to.throw('first argument should be a stream.Readable');
            done();
        });

        it('fails to parse an incomplete JSON object', function(done) {
            fs.writeFileSync(this.tmpFilename, '[{]');
            var stream = fs.createReadStream(this.tmpFilename);
            var error;
            jsoner.parse(stream)
            .on('object', function(object) {
                done(Error('Unexpected object ' + object));
            })
            .on('error', function(err) {
                error = err;
            })
            .on('end', function() {
                expect(error.toString()).to.contain('Incomplete JSON object');
                done();
            });
        });

        it('fails to parse an incomplete field name', function(done) {
            fs.writeFileSync(this.tmpFilename, '[{"foo]');
            var stream = fs.createReadStream(this.tmpFilename);
            var error;
            jsoner.parse(stream)
            .on('object', function(object) {
                done(Error('Unexpected object ' + object));
            })
            .on('error', function(err) {
                error = err;
            })
            .on('end', function() {
                expect(error.toString()).to.contain('Incomplete JSON object');
                done();
            });
        });

        it('fails to parse an incomplete field value', function(done) {
            fs.writeFileSync(this.tmpFilename, '[{"foo": "bar]');
            var stream = fs.createReadStream(this.tmpFilename);
            var error;
            jsoner.parse(stream)
            .on('object', function(object) {
                done(Error('Unexpected object ' + object));
            })
            .on('error', function(err) {
                error = err;
            })
            .on('end', function() {
                expect(error.toString()).to.contain('Incomplete JSON object');
                done();
            });
        });

        it('parses an empty stream', function(done) {
            fs.writeFileSync(this.tmpFilename, '[]');
            var stream = fs.createReadStream(this.tmpFilename);
            jsoner.parse(stream)
            .on('object', function(object) {
                done(Error('Unexpected object ' + object));
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                done();
            });
        });

        _.each('}{[],', function(character) {
            it('parses a field containing ' + character, function(done) {
                fs.writeFileSync(this.tmpFilename, JSON.stringify([
                    { foo: character }
                ]));
                var stream = fs.createReadStream(this.tmpFilename);
                var processed = 0;
                jsoner.parse(stream)
                .on('object', function(object) {
                    expect(object).to.deep.equal({ foo: character });
                    processed++;
                })
                .on('error', function(err) {
                    done(err);
                })
                .on('end', function() {
                    expect(processed).to.equal(1);
                    done();
                });
            });
        });

        it('parses a stream with a simple JSON object', function(done) {
            fs.writeFileSync(this.tmpFilename, JSON.stringify([
                { foo: 'bar' }
            ]));
            var stream = fs.createReadStream(this.tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar' });
                processed++;
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                expect(processed).to.equal(1);
                done();
            });
        });

        it('parses a stream containing nested objects', function(done) {
            var data = {
                foo: 'bar',
                nested: { fizz: 'bar' }
            };

            fs.writeFileSync(this.tmpFilename, JSON.stringify([data]));
            var stream = fs.createReadStream(this.tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal(data);
                processed++;
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                expect(processed).to.equal(1);
                done();
            });
        });

        it('parses a stream containing nested arrays', function(done) {
            var data = {
                foo: 'bar',
                nested: [ 'foo', 'bar' ]
            };

            fs.writeFileSync(this.tmpFilename, JSON.stringify([data]));
            var stream = fs.createReadStream(this.tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal(data);
                processed++;
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                expect(processed).to.equal(1);
                done();
            });

        });

        it('parses a stream with multiple JSON objects', function(done) {
            var objects = [];

            for (var index = 0; index < 1024; index++) {
                objects.push({
                    index: index,
                    foo: 'bar'
                });
            }

            fs.writeFileSync(this.tmpFilename, JSON.stringify(objects));

            var stream = fs.createReadStream(this.tmpFilename);
            var processed = 0;
            jsoner.parse(stream)
            .on('object', function(object) {
                expect(object).to.deep.equal({ foo: 'bar', index: processed });
                processed++;
            })
            .on('error', function(err) {
                done(err);
            })
            .on('end', function() {
                expect(processed).to.equal(1024);
                done();
            });
        });
    });
});
