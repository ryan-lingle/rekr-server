'use strict';
module.exports = (sequelize, DataTypes) => {
  const hashtag_follow = sequelize.define('hashtag_follow', {
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        async isUnique(val) {
          const { followerId, hashtagId } = this;

          const exists = await hashtag_follow.findOne({ where: { followerId, hashtagId } })

          if (exists) {
            throw new Error('Already following this Hashtag')
          }
        }
      }
    },
    hashtagId: DataTypes.INTEGER
  }, {});
  hashtag_follow.associate = function(models) {
    // associations can be defined here
  };
  return hashtag_follow;
};
