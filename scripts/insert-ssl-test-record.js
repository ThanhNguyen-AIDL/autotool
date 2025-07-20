/**
 * Script to insert SSL test record
 * Inserts a test record for SSL/Sosovalue platform testing
 * 
 * Usage: node scripts/insert-ssl-test-record.js
 */

const { Sequelize } = require('sequelize');
const serverConfig = require('../server.config');

async function insertSSLTestRecord() {
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
    console.log('✅ Database connection established.');

    // Check if record already exists
    const [existingRecord] = await sequelize.query(`
      SELECT email, ssl_isverified, computername 
      FROM emails 
      WHERE email = 'abctest1@sharklasers.com'
    `);

    if (existingRecord.length > 0) {
      console.log('ℹ️  Record already exists, updating SSL fields...');
      
      // Update existing record with SSL fields
      await sequelize.query(`
        UPDATE emails 
        SET 
          ssl_isverified = true,
          ssl_lastaction = 0,
          computername = 'henry',
          domain = 'sharklasers.com'
        WHERE email = 'abctest1@sharklasers.com'
      `);
      
      console.log('✅ SSL test record updated successfully');
    } else {
      console.log('Inserting new SSL test record...');
      
      // Insert new record
      await sequelize.query(`
        INSERT INTO emails (
          email,
          iscreated,
          isverified,
          verifycount,
          lastaction,
          lasttraining,
          computername,
          ismain,
          domain,
          ssl_isverified,
          ssl_lastaction
        ) VALUES (
          'abctest1@sharklasers.com',
          true,
          false,
          0,
          0,
          0,
          'henry',
          false,
          'sharklasers.com',
          true,
          0
        )
      `);
      
      console.log('✅ SSL test record inserted successfully');
    }

    // Verify the record
    const [verification] = await sequelize.query(`
      SELECT email, ssl_isverified, ssl_lastaction, computername, domain
      FROM emails 
      WHERE email = 'abctest1@sharklasers.com'
    `);

    if (verification.length > 0) {
      const record = verification[0];
      console.log('\n📋 SSL Test Record Details:');
      console.log(`   Email: ${record.email}`);
      console.log(`   SSL Verified: ${record.ssl_isverified}`);
      console.log(`   SSL Last Action: ${record.ssl_lastaction}`);
      console.log(`   Computer Name: ${record.computername}`);
      console.log(`   Domain: ${record.domain}`);
      console.log(`   Password: TopOne1990@ (stored separately for security)`);
    }

  } catch (error) {
    console.error('❌ Error inserting SSL test record:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run insertion if this script is executed directly
if (require.main === module) {
  insertSSLTestRecord()
    .then(() => {
      console.log('\n🎉 SSL test record operation completed successfully!');
      console.log('💡 You can now test the SSL functionality with:');
      console.log('   POST /api/task/postssl');
      console.log('   Body: {"owner": "henry", "category": "ssl_test", "postContent": "Test post"}');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 SSL test record operation failed:', error);
      process.exit(1);
    });
}

module.exports = { insertSSLTestRecord }; 