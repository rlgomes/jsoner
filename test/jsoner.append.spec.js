var _ = require('underscore');
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

    describe('.appendFile', function() {

        it('fails to append to a file in an inexistent path', function() {
            return jsoner.appendFile('/no/mans/land/foo.juttle', {})
            .then(function() {
                throw Error('previous statement should have failed');
            })
            .catch(function(err) {
                expect(err.toString()).to.match(/ENOENT/);
            });
        });

        it('fails to append an object to an incomplete JSON array', function() {
            return fs.writeFileAsync(tmpFilename, '[ ')
            .then(function() {
                return jsoner.appendFile(tmpFilename, {})
            })
            .then(function() {
                throw Error('previous statement should have failed');
            })
            .catch(function(err) {
                expect(err.toString()).to.contain('not a valid JSON format');
            });
        });

        it('appends to a inexistent file', function() {
            var newFilename = tmp.tmpNameSync();
            var object = { foo: 'bar' };
            jsoner.appendFile(newFilename, object)
            .then(function() {
                return fs.readFileAsync(newFilename)
            })
            .then(function(data) {
                expect(JSON.parse(data.toString())).to.deep.equal([object]);
            })
            .finally(function() {
                return fs.unlinkAsync(newFilename);
            });
        });

        it('appends a JSON object to an empty file', function() {
            var object = { foo: 'bar' };
            return fs.writeFileAsync(tmpFilename, '')
            .then(function() {
                return jsoner.appendFile(tmpFilename, object);
            })
            .then(function() {
                return fs.readFileSync(tmpFilename);
            })
            .then(function(data) {
                expect(JSON.parse(data.toString())).to.deep.equal([object]);
            });
        });

        it('appends a JSON object to a file full of whitespace', function() {
            var object = { foo: 'bar' };
            // XXX: 4096 is 4x the default read chunkSize in the append code this
            // should be configurable.
            return fs.writeFileAsync(tmpFilename, new Array(4096).join(' '))
            .then(function() {
                return jsoner.appendFile(tmpFilename, object);
            })
            .then(function() {
                return fs.readFileAsync(tmpFilename);
            })
            .then(function(data) {
                expect(JSON.parse(data.toString())).to.deep.equal([object]);
            });
        });

        it('appends a JSON object to an empty JSON array', function() {
            var object = { foo: 'bar' };
            return fs.writeFileAsync(tmpFilename, '[]')
            .then(function() {
                return jsoner.appendFile(tmpFilename, object);
            })
            .then(function() {
                return fs.readFileAsync(tmpFilename);
            })
            .then(function(data) {
                expect(JSON.parse(data.toString())).to.deep.equal([object]);
            });
        });

        it('appends multiple JSON objects at once', function() {
            var objects = [];
            for (var index = 0; index < 1024; index++) {
                objects.push({
                    foo: 'bar',
                    index: index
                });
            }
            return fs.writeFileAsync(tmpFilename, '[]')
            .then(function() {
                return jsoner.appendFile(tmpFilename, objects);
            })
            .then(function() {
                return new Promise(function(resolve, reject) {
                    var stream = fs.createReadStream(tmpFilename);
                    var processed = 0;
                    jsoner.parse(stream)
                    .on('object', function(object) {
                        expect(object).to.deep.equal({ foo: 'bar', index: processed });
                        processed++;
                    })
                    .on('end', function() {
                        expect(processed).to.equal(1024);
                        resolve();
                    })
                    .on('error', function(err) {
                        reject(err);
                    });
                });
            });
        });

        it('appends multiple JSON objects one by one', function() {
            var objects = [];
            for (var index = 0; index < 10; index++) {
                objects.push({
                    foo: 'bar',
                    index: index
                });
            }

            return fs.writeFileAsync(tmpFilename, '[]')
            .then(function() {
                var base = Promise.resolve();
              
                _.each(objects, function(object) {
                    base = base.then(function() {
                        return jsoner.appendFile(tmpFilename, object);
                    });
                });

                return base;
            })
            .then(function() {
                return fs.readFileAsync(tmpFilename) 
                .then(function(data) { 
                    var jsonData = JSON.parse(data.toString());
                    expect(jsonData).to.deep.equal(objects);
                });
            });
        });

        it('appends multiple JSON arrays', function() {
            var array1 = [
                { user: 'foo' },
                { user: 'bar' }
            ];
            var array2 = [
                { user: 'fizz' },
                { user: 'buzz' }
            ];

            return fs.writeFileAsync(tmpFilename, '[]')
            .then(function() {
                return jsoner.appendFile(tmpFilename, array1);
            })
            .then(function() {
                return jsoner.appendFile(tmpFilename, array2);
            })
            .then(function() {
                return new Promise(function(resolve, reject) {
                    var stream = fs.createReadStream(tmpFilename);
                    var results = [];
                    jsoner.parse(stream)
                    .on('object', function(object) {
                        results.push(object);
                    })
                    .on('end', function() {
                        expect(results).to.deep.equal(array1.concat(array2));
                        resolve();
                    })
                    .on('error', function(err) {
                        reject(err);
                    });
                });
            });
        });

        it('appends empty JSON arrays', function() {
            var array1 = [
                { user: 'foo' },
                { user: 'bar' }
            ];
            var array2 = [];

            return fs.writeFileAsync(tmpFilename, '[]')
            .then(function() {
                return jsoner.appendFile(tmpFilename, array1);
            })
            .then(function() {
                return jsoner.appendFile(tmpFilename, array2);
            })
            .then(function() {
                return fs.readFileSync(tmpFilename).toString();
            })
            .then(function(data) {
                var results = JSON.parse(data);
                expect(results).to.deep.equal(array1.concat(array2));
            });
        });

        it('always creates the file even on an empty append', function() {
            return jsoner.appendFile(tmpFilename, [])
            .then(function() {
                return fs.readFileSync(tmpFilename).toString();
            })
            .then(function(data) {
                var results = JSON.parse(data);
                expect(results).to.deep.equal([]);
            });
        });

    });

});
