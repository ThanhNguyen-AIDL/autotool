const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');
const _ = require('lodash');

const ProfileEmail = sequelize.define(
  'ProfileEmail',
  {
    email: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    iscreated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isverified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifycount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastaction: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lasttraining: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    computername: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ismain: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // SSL-specific fields for Sosovalue platform
    ssl_isverified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Verification status for SSL/Sosovalue platform'
    },
    ssl_lastaction: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Last action timestamp for SSL/Sosovalue platform (UNIX timestamp)'
    },
  },
  {
    tableName: 'emails',
    timestamps: false,
  }
);

// Optional: convert snake_case to camelCase when calling `.toJSON()`
ProfileEmail.prototype.toJSON = function () {
  const raw = this.get({ plain: true });
  return _.mapKeys(raw, (v, k) => _.camelCase(k));
};

module.exports = ProfileEmail;