module.exports = {
    parse: require('./parse.js'),
    appendFileSync: require('./append.js').appendFileSync,
    appendFile: require('./append.js').appendFile
};
