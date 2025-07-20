const { Sequelize, DataTypes, Op, fn, col, where: whereFn } = require("sequelize");

const ProfileEmail = require('../models/ProfileEmail');

/**
 * SSL Profile Repository for Sosovalue platform
 * Handles SSL-specific profile operations using ssl_isverified and ssl_lastaction fields
 * Follows the same pattern as ProfileRepository but for SSL platform
 */
class SSLProfileRepository {
  
  /**
   * Get all profiles from the database
   * @returns {Promise<Array>} Array of all profile records
   */
  async getAll() {
    return await ProfileEmail.findAll();
  }

  /**
   * Get a random verified profile by computer name for SSL platform
   * Uses ssl_isverified and ssl_lastaction fields for SSL-specific logic
   * @param {string} computerName - The computer name to filter by
   * @param {number} periodRange - Time period in seconds (default: 86400 = 24 hours)
   * @returns {Promise<Object|null>} Random profile or null if none found
   */
  async getProfileByOwner(computerName, periodRange = 86400) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const threshold = currentTimestamp - periodRange;

    const whereClause = {
      computername: computerName,
      ssl_isverified: true, // SSL-specific verification field
      [Op.or]: [
        { ssl_lastaction: { [Op.lt]: threshold } }, // SSL-specific last action field
        { ssl_lastaction: null }
      ]
    };

    const count = await ProfileEmail.count({ where: whereClause });
    if (count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);

    const result = await ProfileEmail.findOne({
      where: whereClause,
      offset: randomOffset,
    });

    return result;
  }

  /**
   * Mark the last action timestamp for SSL platform
   * Updates ssl_lastaction field with current UNIX timestamp
   * @param {string} email - The email address to update
   * @returns {Promise<boolean>} True if update was successful
   */
  async markLastAction(email) {
    const now = Math.floor(Date.now() / 1000); // current UNIX timestamp in seconds

    const [updatedCount] = await ProfileEmail.update(
      { ssl_lastaction: now }, // SSL-specific last action field
      {
        where: {
          email: email
        }
      }
    );

    return updatedCount > 0; // true if at least one record was updated
  }

  /**
   * Create a new profile record
   * @param {Object} data - Profile data to create
   * @returns {Promise<Object>} Created profile record
   */
  async create(data) {
    return await ProfileEmail.create(data);
  }

  /**
   * Update an existing profile record
   * @param {string} email - Email address to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated profile record
   */
  async update(email, updateData) {
    await ProfileEmail.update(updateData, {
      where: { email }
    });
    return await ProfileEmail.findOne({ where: { email } });
  }

  /**
   * Delete a profile record
   * @param {string} email - Email address to delete
   * @returns {Promise<number>} Number of deleted records
   */
  async delete(email) {
    return await ProfileEmail.destroy({ where: { email } });
  }

  /**
   * Get all computer names from profiles
   * @returns {Promise<Array>} Array of computer names
   */
  async getComputerNames() {
    const owners = await ProfileEmail.findAll({
      attributes: ['computername'],
      where: {
        computername: {
          [Sequelize.Op.not]: null
        }
      },
      group: ['computername'],
      raw: true
    });

    return owners.map((row) => row.computername);
  }

  /**
   * Mark a profile as verified for SSL platform
   * @param {string} email - Email address to mark as verified
   * @returns {Promise<boolean>} True if update was successful
   */
  async markAsVerified(email) {
    const [updatedCount] = await ProfileEmail.update(
      { ssl_isverified: true }, // SSL-specific verification field
      {
        where: {
          email: email
        }
      }
    );

    return updatedCount > 0;
  }

  /**
   * Get profiles that are ready for SSL action (verified and not recently used)
   * @param {number} periodRange - Time period in seconds (default: 86400 = 24 hours)
   * @returns {Promise<Array>} Array of ready profiles
   */
  async getReadyProfiles(periodRange = 86400) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const threshold = currentTimestamp - periodRange;

    return await ProfileEmail.findAll({
      where: {
        ssl_isverified: true, // SSL-specific verification field
        [Op.or]: [
          { ssl_lastaction: { [Op.lt]: threshold } }, // SSL-specific last action field
          { ssl_lastaction: null }
        ]
      }
    });
  }

}

module.exports = new SSLProfileRepository(); 