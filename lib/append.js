var _ = require('lodash');
var fs = require('fs');

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
    var totalBytesRead = 0;
    var bytesRead = 0;
    var chunkSize = 1024;
    var buffer = new Buffer(chunkSize);
    var index = 0;
    var fd = fs.openSync(path, 'r');
    try {
        var stats = fs.fstatSync(fd);
        var skip = (stats.size - from) || 0;

        while (totalBytesRead < stats.size) {
            var position = stats.size - totalBytesRead - chunkSize;
            bytesRead = fs.readSync(fd, buffer, 0, chunkSize, position);
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
                    return stats.size - (totalBytesRead + (bytesRead - index));
                }

                return -1;
            }

            totalBytesRead += bytesRead;
        }

        // If the whole file is empty or comprised of simply whitespace
        return -2;
    } finally {
        fs.closeSync(fd);
    }
}

module.exports = {
    appendFileSync: function(filename, element, options) {
        /**
         * Append a JSON object to the filename specified by appending to the
         * existing JSON Array.
         *
         *  options: {
         *      replacer: null, // replacer argument passed to
         *                      //  JSON.stringify(value, replacer, space)
         *      space: 4        // space argument passed to
         *                      //  JSON.stringify(value, replacer, space)
         *  }
         */

        try {
            fs.statSync(filename);
        } catch (err) {
            if (err.toString().match(/ENOENT/)) {
                fs.writeFileSync(filename, '[]');
            } else {
                throw err;
            }
        }

        if (element.length === 0) {
            // nothing to write
            return;
        }

        options = _.extend({
            replacer: null,
            space: 4
        }, options);

        function stringify(object) {
            return JSON.stringify(object, options.replacer, options.space);
        }

        var fd = fs.openSync(filename, 'r+');

        try {
            var lastSquareBracket = findLast(filename, ']');

            if (lastSquareBracket === -1) {
                throw Error(filename + ' not a valid JSON format');
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
                fs.writeSync(fd, output);
            } else {
                // If we can't find a } then this is a file with simply [] in it
                var lastCurlyBracket = findLast(filename,
                                                '}',
                                                lastSquareBracket);
                if (lastCurlyBracket > 0) {
                    output = ',\n';
                } else {
                    output = '';
                }
                output += elementString + ']';
                fs.writeSync(fd, output, lastSquareBracket);
            }
        } finally {
            fs.closeSync(fd);
        }
    }
};
