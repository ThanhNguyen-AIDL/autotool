const { Sequelize, DataTypes, Op, fn, col, where: whereFn } = require("sequelize");

const CooldownState = require('../models/CooldownState');
const PromptCategory = require('../models/PromptCategory');

class CooldownRepository {

    async create(data) {
        return await CooldownState.create(data);
    }

    async getAll(pcName) {
        if (!pcName) return [];

        return await CooldownState.findAll({ where: { computername: pcName } });
    }


    async syncCooldowns(pcName) {
        const defaultPeriod = 1800
        const categories = await PromptCategory.findAll();
        for (const category of categories) {
            const existing = await CooldownState.findOne({ where: { category: category?.name, computername: pcName } });
            if (!existing) {
                await CooldownState.create({
                    category: category?.name,
                    computername: pcName,
                    cooldown_period: defaultPeriod,
                });
                console.log(`Created config for category ${category.name}`);
            }
        }

    }


    async update(id, updateData) {
        await CooldownState.update(updateData, {
            where: { id }
        });
        return await CooldownState.findOne({ where: { id } });
    }


    async markExecuted(category, pcName) {
        const now = Math.floor(Date.now() / 1000);

        const [record, created] = await CooldownState.findOrCreate({
            where: { category, computername: pcName },
            defaults: {
                last_run: now,
                cooldown_period: 1800 // default period, adjust as needed
            }
        });

        if (!created) {
            await record.update({ last_run: now });
        }

        return true;
    }
    
    async canExecute(category, pcName) {
        const now = Math.floor(Date.now() / 1000); // current UNIX timestamp in seconds
        const existing = await CooldownState.findOne({ where: { category, computername: pcName } });

        if (!existing) { return true }

        return now - existing?.last_run >= existing?.cooldown_period;

    }


    async delete(id) {
        return await CooldownState.destroy({ where: { id } });
    }



}

module.exports = new CooldownRepository();
