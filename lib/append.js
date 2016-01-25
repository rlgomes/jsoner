var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

function findLast(path, character, from) {
    /*
     * Finds the last occurrence of the character supplied within the file
     * specified. While searching white space characters are ignored.
     *
     * path: exact filepath that points to the file on disk
     * character: the character you're looking for
     * from: location to start searching from
     *
     * Returns:
     *  >=0: which is the location of the character you wanted
     *  -1:  couldn't find the specific character and ended up finding another
     *       non whitespace character
     *  -2:  couldn't find the character since the file contained nothing
     *       other than whitespace characters
     */

    function searchFor(fd, stats, totalBytesRead, character) {
        return Promise.try(function() {
            var chunkSize = 1024;
            var skip = (stats.size - from) || 0;
            var buffer = new Buffer(chunkSize);
            var index = 0;

            if (totalBytesRead < stats.size) {
                var position = stats.size - totalBytesRead - chunkSize;
                return fs.readAsync(fd, buffer, 0, chunkSize, position)
                .then(function(bytesRead) {
                    var chunk = buffer.slice(0, bytesRead).toString();

                    // Scan the line looking for the desired character, while ignoring
                    // all whitespace characters and immediately exiting if any other
                    // non whitespace is found.
                    for (index = bytesRead - 1; index >= 0; index--) {
                        if (skip > 0) {
                            skip--;
                            continue;
                        }

                        if (chunk[index].match(/\s/)) {
                            continue;
                        }

                        if (chunk[index] === character) {
                            return Promise.resolve(stats.size - (totalBytesRead + (bytesRead - index)));
                        }

                        return Promise.resolve(-1);
                    }
                    return searchFor(fd, stats, totalBytesRead + bytesRead, character);
                });
            }

            // If the whole file is empty or comprised of simply whitespace
            return Promise.resolve(-2);
        });
    }

    return fs.openAsync(path, 'r')
    .then(function(fd) {
        return fs.fstatAsync(fd)
        .then(function(stats) {
            return searchFor(fd, stats, 0, character);
        })
        .finally(function() {
            return fs.closeAsync(fd);
        });
    });
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
        var fd;
        return Promise.try(function() {
            try {
                fs.statSync(filename);
            } catch (err) {
                if (err.toString().match(/ENOENT/)) {
                    fs.writeFileSync(filename, '[]');
                } else {
                    return Promise.reject(err);
                }
            }

            if (element.length === 0) {
                // nothing to write
                return Promise.resolve();
            }

            options = _.extend({
                replacer: null,
                space: 4
            }, options);

            function stringify(object) {
                return JSON.stringify(object, options.replacer, options.space);
            }

            fd = fs.openSync(filename, 'r+');

            return findLast(filename, ']')
            .then(function(lastSquareBracket) {
                if (lastSquareBracket === -1) {
                    return Promise.reject(new Error(filename + ' not a valid JSON format'));
                }

                var elementString;

                if (element instanceof Array) {
                    elementString = stringify(element);
                    elementString = elementString.slice(1,
                                                        elementString.length - 1);
                } else {
                    elementString = stringify(element);
                }

                var output;
                if (lastSquareBracket === -2) {
                    output = '[';
                    output += elementString + ']';
                    return fs.writeAsync(fd, output);
                } else {
                    // If we can't find a } then this is a file with simply [] in it
                    return findLast(filename, '}', lastSquareBracket)
                    .then(function(lastCurlyBracket) {
                        if (lastCurlyBracket > 0) {
                            output = ',\n';
                        } else {
                            output = '';
                        }
                        output += elementString + ']';
                        return fs.writeAsync(fd, output, lastSquareBracket);
                    });
                }
            })
            .finally(function() {
                return Promise.try(function() {
                    if (fd) {
                        fs.closeSync(fd);
                    }
                });
            });
        });
    }
};
