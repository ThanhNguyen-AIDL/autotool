const { Sequelize, DataTypes, Op, fn, col, where: whereFn } = require("sequelize");

const Profile = require('../models/Profile');

class ProfileRepository {
  async getAll() {
    return await Profile.findAll();
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

}

module.exports = new ProfileRepository();
