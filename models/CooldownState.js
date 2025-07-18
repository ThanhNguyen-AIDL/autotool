const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');
const _ = require('lodash');

const CooldownState = sequelize.define(
    'CooldownState',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        computername: {
            type: DataTypes.STRING,
        },
        category: {
            type: DataTypes.STRING,
        },
        cooldown_period: {
            type: DataTypes.INTEGER,
            defaultValue: 1800,
        },
        last_run: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
        },
    },
    {
        tableName: 'cooldown_states',
        timestamps: false,
    }
);


// Override `toJSON()` to convert snake_case to camelCase
CooldownState.prototype.toJSON = function () {
    const rawData = this.get({ plain: true });
    return _.mapKeys(rawData, (value, key) => _.camelCase(key));
};


module.exports = CooldownState;
