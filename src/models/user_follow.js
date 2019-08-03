'use strict';
module.exports = (sequelize, DataTypes) => {
  const user_follow = sequelize.define('user_follow', {
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        async isUnique(val) {
          const { followerId, followeeId } = this;

          if (followerId == followeeId) {
            throw new Error('You Cannnot Follow Yourself!');
          }
          const exists = await user_follow.findOne({ where: { followerId, followeeId } })

          if (exists) {
            throw new Error('Already following this User')
          }
        }
      }
    },
    followeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {});

  user_follow.associate = function(models) {
    // associations can be defined here
  };

  return user_follow;
};
