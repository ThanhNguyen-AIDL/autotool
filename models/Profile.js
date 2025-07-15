const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');
const _ = require('lodash');

const Comment = sequelize.define(
  'Profile',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
    },
    auth: {
      type: DataTypes.STRING(5000),
    },
    owner: {
      type: DataTypes.STRING(100),
    },
    is_main: {
      type: DataTypes.BOOLEAN,
    },
    last_action: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    }
  },
  {
    tableName: 'profiles',
    timestamps: true,
    updatedAt: 'updated_at', // Use the correct field name
    createdAt: 'created_at', // Use the correct field name
  
  }
);


// Override `toJSON()` to convert snake_case to camelCase
Comment.prototype.toJSON = function () {
  const rawData = this.get({ plain: true });
  return _.mapKeys(rawData, (value, key) => _.camelCase(key));
};


module.exports = Comment;
