'use strict';
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");

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
    satoshis: {
      type: DataTypes.INTEGER,
      validate: {
        async isPositive(satoshis) {
          if ((satoshis) < 0) {
            throw new Error('Not enough funds.')
          }
        }
      }
    },
    password: DataTypes.STRING
  }, {
    getterMethods: {
      followers: async function() {
        const Follows = sequelize.models.follows;
        const count = Follows.count({ where: { followeeId: this.id }})
        const stream = await this.getFollowers({ limit: 10 });
        const more = stream.length == 10;
        return { stream, more, count };
      },
      following: async function() {
        const Follows = sequelize.models.follows;
        const count = Follows.count({ where: { followerId: this.id }})
        const stream = await this.getIsFollowing({ limit: 10 });
        const more = stream.length == 10;
        return { stream, more, count };
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

        await Podcast.destroy({ where: { userId: user.id }, individualHooks: true })
        await Rek.destroy({ where: { userId: user.id }, individualHooks: true })

      }
    }
  });
  user.associate = function(models) {
    user.hasMany(models.podcast);
    user.hasMany(models.rek);
    user.hasMany(models.bookmark);
    user.hasMany(models.rek_view);
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

  user.prototype.getFeed = async function({ offset }) {
    const Rek = sequelize.models.rek;
    const { Op } = Sequelize;

    const following = await this.following;
    const ids = following.stream.map(user => user.id);
    ids.push(this.id);

    const stream = await Rek.findAll({
      where: {
        userId: {
          [Op.in]: ids
        }
      },
      order: [['satoshis', 'DESC']],
      offset,
      limit: 10,
    })
    const len = stream.length;
    const more = len == 10;
    return { stream, more }
  }

  user.prototype.follow = async function(followeeId) {
    const Follows = sequelize.models.follows;
    return await Follows.create({ followerId: this.id, followeeId })
  }

  user.prototype.unfollow = async function(followeeId) {
    const Follows = sequelize.models.follows;
    return await Follows.desroy({ where: { followerId: this.id, followeeId }})
  }

  user.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  }

  return user;
};
