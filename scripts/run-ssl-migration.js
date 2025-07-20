/**
 * Manual migration script to add SSL columns to emails table
 * Run this script if automatic migrations are not working
 * 
 * Usage: node scripts/run-ssl-migration.js
 */

const { Sequelize } = require('sequelize');
const serverConfig = require('../server.config');

async function runSSLMigration() {
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
          rejectUnauthorized: false,
        },
      },
    }
  );

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'emails' 
      AND column_name IN ('ssl_isverified', 'ssl_lastaction')
    `);

    if (results.length === 2) {
      console.log('✅ SSL columns already exist in emails table');
      return;
    }

    console.log('Adding SSL columns to emails table...');

    // Add SSL columns
    await sequelize.query(`
      ALTER TABLE emails 
      ADD COLUMN IF NOT EXISTS ssl_isverified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ssl_lastaction INTEGER DEFAULT 0
    `);

    // Add comments
    await sequelize.query(`
      COMMENT ON COLUMN emails.ssl_isverified IS 'Verification status for SSL/Sosovalue platform'
    `);

    await sequelize.query(`
      COMMENT ON COLUMN emails.ssl_lastaction IS 'Last action timestamp for SSL/Sosovalue platform (UNIX timestamp)'
    `);

    console.log('✅ SSL columns successfully added to emails table');
    console.log('   - ssl_isverified (BOOLEAN, default: FALSE)');
    console.log('   - ssl_lastaction (INTEGER, default: 0)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runSSLMigration()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runSSLMigration }; 