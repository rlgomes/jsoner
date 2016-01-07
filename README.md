# jsoner

Simple, fast, minimalist JSON library for [node](http://nodejs.org)

## Installation

```bash
$ npm install jsoner
```

## Features

  * stream parsing so you can read unlimited amounts of JSON data without ever
  	having to hold the totality of the data in memory.
  * append to a JSON file on disk without having to ever read the whole object
    into memory.

## Examples

### Reading JSON objects from a large JSON file

```js
var jsoner = require('jsoner');

var stream = fs.createReadStream('really_big.json');
jsoner.parse(stream)
.on('object', function(object) { 
    console.log(JSON.stringify(object));
})
.on('error', function(err) { 
    // do something with the error
}
.on('end', function() { 

};
```

### Appending multiple JSON objects to a JSON Array on disk

```js
var jsoner = require('jsoner');

jsoner.appendFileSync('users.json', {
    firstName: "John",
    lastName:"Doe"
});

jsoner.appendFileSync('users.json', {
    firstName: "Jane",
    lastName:"Doe"
});
```

## Development

To contribute feel free to open any issues or pull request. When developing
locally make sure to run the built-in tests like so:

```bash
gulp test
```

In travis we run the following gulp tasks to make sure the current code is
ready to be shipped:

```bash
gulp lint coverage
```

That runs the lint checks and then follows up with the same tests executed
during `gulp test` but with the additional verification that 100% of the code
is covered during testing and no untested code is introduced.
