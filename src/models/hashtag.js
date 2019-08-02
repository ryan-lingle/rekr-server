'use strict';
module.exports = (sequelize, DataTypes) => {
  const hashtag = sequelize.define('hashtag', {
    name: DataTypes.STRING
  }, {});
  hashtag.associate = function(models) {
    hashtag.belongsToMany(models.rek, {
      through: models.tag,
      as: 'reks',
      foreignKey: 'hashtagId',
    });
  };
  return hashtag;
};
