const { Sequelize } = require('sequelize');
const serverConfig = require('../server.config')


const sequelize = new Sequelize(serverConfig.database.dbName, serverConfig.database.user, serverConfig.database.password, {
  host: serverConfig.database.host,
  dialect: 'postgres',
  port: serverConfig.database.port,
  logging: false,  // Optional: disable logging if not needed
});

sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Database connection error:', err));

module.exports = sequelize;
