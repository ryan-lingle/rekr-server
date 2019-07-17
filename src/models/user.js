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
    getterMethods: {
      followers: async function() {
        return await this.getFollowers();
      },
      following: async function() {
        return await this.getIsFollowing();
      }
    },
    hooks: {
      beforeCreate: async function(user) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      },
      beforeDestroy: async function(user) {
        const Podcast = sequelize.models.podcast;
        const Rek = sequelize.models.rek;
        const Follows = sequelize.models.follows;

        await Podcast.destroy({ where: { userId: user.id }, individualHooks: true })
        await Rek.destroy({ where: { userId: user.id }, individualHooks: true })
        // await Follows.destroy({ where: {
        //   $or: [
        //     { followerId: user.id },
        //     { followeeId: user.id },
        //   ]
        // }})
      }
    }
  });
  user.associate = function(models) {
    user.hasMany(models.podcast);
    user.hasMany(models.rek);
    user.belongsToMany(user, {
      through: models.follows,
      as: 'followers',
      foreignKey: 'followeeId',
    });

    user.belongsToMany(user, {
      through: models.follows,
      as: 'isFollowing',
      foreignKey: 'followerId',
    });
  };

  user.prototype.getFeed = async function() {
    const following = await this.following;
    const feed = [];
    const reks = await Promise.all(following.map(async user => {
      return user.getReks()
    }))
    return reks.flat().sort((a, b) => b.satoshis - a.satoshis);
  }

  user.prototype.follow = async function(followeeId) {
    const Follows = sequelize.models.follows;
    return await Follows.create({ followerId: this.id, followeeId })
  }

  user.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  }

  return user;
};
