'use strict';
module.exports = (sequelize, DataTypes) => {
  const hashtag_follow = sequelize.define('hashtag_follow', {
    followerId: DataTypes.INTEGER,
    hashtagId: DataTypes.INTEGER
  }, {});
  hashtag_follow.associate = function(models) {
    // associations can be defined here
  };
  return hashtag_follow;
};
