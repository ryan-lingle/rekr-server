'use strict';
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      }
    },
    username: {
      type: DataTypes.STRING,
      validate: {
        async isPresent(username) {
          if (!username) {
            throw new Error("username is not present")
          }
        },

        async isUnique(username) {
          const _user = await user.findOne({where: { username }});
          if (_user) {
            throw new Error('username must be unique.');
          }
        },

        async lessThan20Characters(username) {
          if (username.length > 20) {
            throw new Error('username cannot be greater than 20 characters')
          }
        },

        async whiteListCharacter(username) {
          const whitelisted = "qwertyuiopasdfghjklzxcvbnm?!_1234567890$"
          username.split('').forEach(s => {
            if (!whitelisted.includes(s.toLowerCase())) {
              throw new Error(`username cannot contain ${s}`)
            }
          })
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
    password: DataTypes.STRING,
    profilePic: DataTypes.STRING,
  }, {
    getterMethods: {
      followers: async function() {
        const UserFollow = sequelize.models.user_follow;
        const count = UserFollow.count({ where: { followeeId: this.id }})
        const stream = await this.getFollowers({ limit: 10 });
        const more = stream.length == 10;
        return { stream, more, count };
      },
      following: async function() {
        const UserFollow = sequelize.models.user_follow;
        const count = UserFollow.count({ where: { followerId: this.id }})
        const stream = await this.getIsFollowing({ limit: 10 });
        const more = stream.length == 10;
        return { stream, more, count };
      }
    },
    hooks: {
      beforeCreate: async function(user) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        if (!user.profilePic) user.profilePic = randomProfilePic();
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
      through: models.user_follow,
      as: 'followers',
      foreignKey: 'followeeId',
    });

    user.belongsToMany(user, {
      through: models.user_follow,
      as: 'isFollowing',
      foreignKey: 'followerId',
    });

    user.belongsToMany(models.hashtag, {
      through: models.hashtag_follow,
      as: 'followedHashtags',
      foreignKey: 'followerId',
    });
  };

  user.prototype.getFeed = async function({ offset }) {
    const Rek = sequelize.models.rek;
    const RekView = sequelize.models.rek_view;
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
      order: [['valueGenerated', 'DESC']],
      offset,
      limit: 10,
      include: [{
        model: RekView,
        order: [sequelize.fn(this.id, sequelize.col('userId'))]
      }]
    })
    const len = stream.length;
    const more = len == 10;
    return { stream, more }
  }

  user.prototype.follow = async function(followeeId) {
    const UserFollow = sequelize.models.user_follow;
    return await UserFollow.create({ followerId: this.id, followeeId })
  }

  user.prototype.unfollow = async function(followeeId) {
    const UserFollow = sequelize.models.user_follow;
    return await UserFollow.desroy({ where: { followerId: this.id, followeeId }})
  }

  user.prototype.validPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  }

  user.search = async function({ term, offset }) {
    const split = term.split(' ');
    if (split.length > 1) {
      return await sequelize.query(`
        SELECT *
        FROM ${this.tableName}
        WHERE _search @@ plainto_tsquery('english', :term)
        LIMIT 10
        OFFSET :offset;
      `, {
        model: this,
        replacements: { term, offset },
      });
    } else {
      return await sequelize.query(`
        SELECT *
        FROM ${this.tableName}
        WHERE _search @@ to_tsquery('english', :term)
        LIMIT 10
        OFFSET :offset;
      `, {
        model: this,
        replacements: { term: term + ":*", offset },
      });
    };
  }

  function randomProfilePic() {
    const num = Math.floor((Math.random() * 4) + .99);
    return `https://rekr-profile-pics.sfo2.digitaloceanspaces.com/default-${num}.png`;
  }

  return user;
};
