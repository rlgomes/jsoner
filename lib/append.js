var _ = require('underscore');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var CHAR_NOT_FOUND = -1;
var EMPTY_FILE = -2;
var READ_SIZE = 1024;

function findLast(fd, stats, character, from) {
    var skip = from ? (stats.size - from) : 0;

    function searchFor(fd, stats, totalBytesRead, character) {
        var buffer = new Buffer(READ_SIZE);

        if (totalBytesRead < stats.size) {
            var position = Math.max(0, stats.size - totalBytesRead - READ_SIZE);

            return fs.readAsync(fd, buffer, 0, READ_SIZE, position)
            .then(function(bytesRead) {
                var chunk = buffer.slice(0, bytesRead).toString();

                // Scan the line looking for the desired character, while ignoring
                // all whitespace characters and immediately exiting if any other
                // non whitespace is found.
                for (var index = bytesRead - 1; index >= 0; index--) {
                    if (skip > 0 ) {
                        skip--;
                        continue;
                    }

                    if (chunk[index].match(/\s/)) {
                        continue;
                    }

                    if (chunk[index] === character) {
                        return stats.size - (totalBytesRead + (bytesRead - index));
                    }

                    return CHAR_NOT_FOUND;
                }

                return searchFor(fd, stats, totalBytesRead + bytesRead);
            });
        }

        // If the whole file is empty or comprised of simply whitespace
        return Promise.resolve(EMPTY_FILE);
    }

    return searchFor(fd, stats, 0, character);
}

module.exports = {
    appendFile: function(filename, element, options) {
        /**
         * Append a JSON object to the filename specified by appending to the
         * existing JSON Array.
         * *  options: {
         *      replacer: null, // replacer argument passed to
         *                      //  JSON.stringify(value, replacer, space)
         *      space: 4        // space argument passed to
         *                      //  JSON.stringify(value, replacer, space)
         *  }
         *
         * returns: Promise
         */
        options = _.extend({
            replacer: null,
            space: 4
        }, options);

        function stringify(object) {
            return JSON.stringify(object, options.replacer, options.space);
        }

        return fs.statAsync(filename)
        .catch(function(err) {
            if (err.toString().match(/ENOENT/)) {
                return fs.writeFileAsync(filename, '[]')
                .then(function() {
                    return fs.statAsync(filename);
                });
            } else {
                throw err;
            }
        })
        .then(function(stats) {
            if (element.length === 0) {
                // nothing to write
                return;
            }

            var output;
            var offset = 0;
            return fs.openAsync(filename, 'r+')
            .then(function(fd) {
                return findLast(fd, stats, ']', 0)
                .then(function(lastSquareBracket) {
                    if (lastSquareBracket === CHAR_NOT_FOUND) {
                        throw new Error(filename + ' not a valid JSON format');
                    }

                    var elementString;
                    if (_.isArray(element)) {
                        elementString = stringify(element);
                        elementString = elementString.slice(1,
                                                            elementString.length - 1);
                    } else {
                        elementString = stringify(element);
                    }

                    if (lastSquareBracket === EMPTY_FILE) {
                        output = '[' + elementString + ']';
                    } else {
                        // If we can't find a } then this is a file with simply [] in it
                        return findLast(fd, stats, '}', lastSquareBracket)
                        .then(function(lastCurlyBracket) {
                            if (lastCurlyBracket > 0) {
                                output = ',\n';
                            } else {
                                output = '';
                            }
                            output += elementString + ']';
                            offset = lastSquareBracket;
                        });
                    }
                })
                .then(function() {
                    return fs.writeAsync(fd, output, offset)
                    .finally(function() {
                        return fs.closeAsync(fd);
                    });
                });
            });
        });
    }
};
