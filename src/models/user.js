'use strict';
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    email: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      validate: {
        async isUnique(username) {
          const _user = await user.findOne({where: { username }});
          if (_user) {
            throw new Error('username must be unique.');
          }
        }
      }
    },
    password: DataTypes.STRING
  }, {
    hooks: {
      beforeCreate: async function(user) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  });
  user.associate = function(models) {
    user.hasMany(models.podcast);
    user.hasMany(models.rek);
  };

  user.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  }

  return user;
};
