'use strict';
module.exports = (sequelize, DataTypes) => {
  const follows = sequelize.define('follows', {
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        async isUnique(val) {
          const { followerId, followeeId } = this;

          if (followerId == followeeId) {
            throw new Error('You Cannnot Follow Yourself!');
          }
          const exists = await follows.findOne({ where: { followerId, followeeId } })

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

  follows.associate = function(models) {
    // associations can be defined here
  };

  return follows;
};
