module.exports = {
    ecoutor: {
        category: process.env.LISTEN_CATEGORY,
        source_clubs: process.env.TABLE_SOURCE_CLUBS,
        dest_clubs: process.env.TABLE_DEST_CLUBS,
    },
    rethinkdb: {
        host: process.env.RDB_HOST,
        port: process.env.RDB_PORT,
        db: process.env.RDB_DATABASE,
        user: process.env.RDB_USER,
        password: process.env.RDB_PASSWORD,
        authKey: process.env.RDB_TOKEN_SECRET,
    },
    express: {
        host: process.env.HTTP_HOST,
        port: process.env.HTTP_PORT,
    }
};