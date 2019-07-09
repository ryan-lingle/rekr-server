'use strict';
module.exports = (sequelize, DataTypes) => {
  const podcast = sequelize.define('podcast', {
    title: DataTypes.STRING,
    rss: DataTypes.STRING,
    email: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    itunesId: DataTypes.INTEGER,
  }, {});

  podcast.associate = function(models) {
    podcast.hasMany(models.episode);
    podcast.belongsTo(models.user)
  };
  return podcast;
};
