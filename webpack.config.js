module.exports = {

    watch: true,

    entry: './example.js',

    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000,
        ignored: /node_modules/,
    },

    devtool: 'source-map',
}