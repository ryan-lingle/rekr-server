'use strict';
module.exports = (sequelize, DataTypes) => {
  const tag = sequelize.define('tag', {
    rekId: DataTypes.INTEGER,
    hashtagId: DataTypes.INTEGER
  }, {});
  tag.associate = function(models) {
    tag.belongsTo(models.hashtag);
    tag.belongsTo(models.rek);
  };
  return tag;
};
