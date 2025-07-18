const { Sequelize, DataTypes, Op, fn, col, where: whereFn } = require("sequelize");

const ProfileEmail = require('../models/ProfileEmail');

class ProfileRepository {
  async getAll() {
    return await ProfileEmail.findAll();
  }


  async getProfileByOwner(computerName, periodRange = 86400) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const threshold = currentTimestamp - periodRange;

    const whereClause = {
      computername: computerName,
      isverified: true,
      [Op.or]: [
        { lastaction: { [Op.lt]: threshold } },
        { lastaction: null }
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



  async markLastAction(email) {
    const now = Math.floor(Date.now() / 1000); // current UNIX timestamp in seconds

    const [updatedCount] = await ProfileEmail.update(
      { lastaction: now },
      {
        where: {
          email: email
        }
      }
    );

    return updatedCount > 0; // true if at least one record was updated
  }



  async create(data) {
    return await ProfileEmail.create(data);
  }

  async update(id, updateData) {
    await ProfileEmail.update(updateData, {
      where: { id }
    });
    return await ProfileEmail.findOne({ where: { id } });
  }


  async delete(id) {
    return await ProfileEmail.destroy({ where: { id } });
  }

  async getCompunterNames() {
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

}

module.exports = new ProfileRepository();
