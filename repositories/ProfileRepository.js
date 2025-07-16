const { Sequelize, DataTypes, Op, fn, col, where: whereFn } = require("sequelize");

const Profile = require('../models/Profile');

class ProfileRepository {
  async getAll() {
    return await Profile.findAll();
  }


  async getProfileByName(computerName, periodRange = 100 ) {
    


  }



  async create(data) {
    return await Profile.create(data);
  }

  async update(id, updateData) {
    await Profile.update(updateData, {
      where: { id }
    });
    return await Profile.findOne({ where: { id } });
  }
  

  async delete(id) {
    return await Profile.destroy({ where: { id } });
  }

  async getCompunterNames(){
    const owners = await Profile.findAll({
        attributes: ['owner'],
        where: {
          owner: {
            [Sequelize.Op.not]: null
          }
        },
        group: ['owner'],
        raw: true
    });

    return owners.map((row) => row.owner);
  }

}

module.exports = new ProfileRepository();
