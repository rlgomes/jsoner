var _ = require('lodash');
var events = require('events');
var stream = require('stream');

module.exports = function(input) {
    /**
     * Parse the input provided which must be a inputs.Readable like so:
     *
     *     https://nodejs.org/api/input.html#input_class_input_readable
     *
     * The follow events are fired:
     *
     *  * `object` - with the first argument containing the top level JSON
     *               object found in the stream.
     *  * `error` - with the first argument being the actual error that was hit.
     *  * `end` - when we've finished processing the stream.
     */
    var result = new events.EventEmitter();

    if (input instanceof stream.Readable) {
        var objects = 0;
        var previousCharacter;
        var openDoubleQuotes = false;
        var buffer = '';

        input.on('data', function(chunk) {
            _.each(chunk.toString(), function(character) {
                // Ignore all top level '[', ']' and ',' characters
                if (objects === 0 &&
                    _.indexOf(['[', ']', ','], character) !== -1) {
                    return;
                }

                if (character === '"') {
                    openDoubleQuotes = !openDoubleQuotes;
                }

                buffer += character;
                previousCharacter = character;
                if (openDoubleQuotes) {
                    return;
                }

                if (character === '{') {
                    objects++;
                } else if (character === '}') {
                    objects--;
                    if (objects === 0) {
                        // Complete top level object
                        result.emit('object', JSON.parse(buffer));
                        buffer = '';
                    }
                }
            });
        });

        input.on('end', function() {
            if (buffer.length !== 0) {
                result.emit('error',
                            Error('Incomplete JSON object: ' + buffer));
            }
            result.emit('end');
        });
    } else {
        throw Error('first argument should be a stream.Readable');
    }

    return result;
};
