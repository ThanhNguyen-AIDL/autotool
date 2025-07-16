const dotenv = require("dotenv");
dotenv.config()

module.exports = {
    database: {
        // Get environment variables
        host: process.env.DB_HOST || 'localhost',
        port : process.env.DB_PORT || 5432,  // Default PostgreSQL port
        user : process.env.DB_USER || 'memepush',  // Set this as per your DB settings
        password : process.env.DB_PASSWORD || 'secure_password',
        dbName : process.env.DB_NAME || 'spamweb',
    },
}