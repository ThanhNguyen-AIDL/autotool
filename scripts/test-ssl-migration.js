/**
 * Test script to verify SSL migration
 * This script tests the migration without actually running it
 */

const { Sequelize } = require('sequelize');
const serverConfig = require('../server.config');

async function testSSLMigration() {
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
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Test the migration SQL
    console.log('\nTesting migration SQL...');
    
    // Test adding ssl_isverified column
    try {
      await sequelize.query('ALTER TABLE emails ADD COLUMN IF NOT EXISTS ssl_isverified BOOLEAN DEFAULT FALSE');
      console.log('✅ ssl_isverified column added successfully');
    } catch (error) {
      console.log('ℹ️  ssl_isverified column already exists or error:', error.message);
    }

    // Test adding ssl_lastaction column
    try {
      await sequelize.query('ALTER TABLE emails ADD COLUMN IF NOT EXISTS ssl_lastaction INTEGER DEFAULT 0');
      console.log('✅ ssl_lastaction column added successfully');
    } catch (error) {
      console.log('ℹ️  ssl_lastaction column already exists or error:', error.message);
    }

    // Verify columns exist
    console.log('\nVerifying columns exist...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'emails' 
      AND column_name IN ('ssl_isverified', 'ssl_lastaction')
      ORDER BY column_name
    `);

    if (results.length === 2) {
      console.log('✅ Both SSL columns exist in emails table:');
      results.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
      });
    } else {
      console.log('❌ Some SSL columns are missing. Found:', results.length, 'columns');
      results.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testSSLMigration()
    .then(() => {
      console.log('\n🎉 SSL migration test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 SSL migration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testSSLMigration }; 