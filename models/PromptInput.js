const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');
const _ = require('lodash');

const PromtInput = sequelize.define(
  'PromptInput',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
    },
    category: {
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
    tableName: 'prompt_inputs',
    timestamps: true,
    updatedAt: 'updated_at', // Use the correct field name
    createdAt: 'created_at', // Use the correct field name

  }
);


// Override `toJSON()` to convert snake_case to camelCase
PromtInput.prototype.toJSON = function () {
  const rawData = this.get({ plain: true });
  return _.mapKeys(rawData, (value, key) => _.camelCase(key));
};


module.exports = PromtInput;
