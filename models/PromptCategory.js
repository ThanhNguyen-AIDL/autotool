const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');
const _ = require('lodash');

const PromptCategory = sequelize.define(
  'PromptCategory',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    }

  },
  {
    tableName: 'prompt_categories',  
    timestamps: true,
    updatedAt: 'updated_at', // Use the correct field name
    createdAt: 'created_at', // Use the correct field name

  }
);


// Override `toJSON()` to convert snake_case to camelCase
PromptCategory.prototype.toJSON = function () {
  const rawData = this.get({ plain: true });
  return _.mapKeys(rawData, (value, key) => _.camelCase(key));
};


module.exports = PromptCategory;
