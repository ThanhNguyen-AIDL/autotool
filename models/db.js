const { Sequelize } = require('sequelize');
const serverConfig = require('../server.config');
const logger = require('../middlewares/logger');


const sequelize = new Sequelize(
  serverConfig.database.dbName,
  serverConfig.database.user,
  serverConfig.database.password,
  {
    host: serverConfig.database.host,
    dialect: 'postgres',
    port: serverConfig.database.port,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // ⚠️ use with caution in production
      },
    },
    pool: {
      max: 3,       // maximum number of connections
      min: 0,        // minimum number of connections
      acquire: 30000, // max time (ms) to try getting connection before throwing
      idle: 10000,   // time (ms) before releasing idle connection
      evict: 1000,   // time (ms) to check and evict idle connections
    },
    retry: {
      max: 5, // number of auto-retries for queries
    },
  }
);

sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => logger.error('Database connection error:'+ err));

module.exports = sequelize;
