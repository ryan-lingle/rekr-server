'use strict';
module.exports = (sequelize, DataTypes) => {
  const podcast = sequelize.define('podcast', {
    title: DataTypes.STRING,
    rss: DataTypes.STRING,
    email: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    website: DataTypes.STRING,
    itunesId: DataTypes.INTEGER,
  }, {
    hooks: {
      beforeDestroy: async function(podcast) {
        const Episode = sequelize.models.episode;
        await Episode.destroy({ where: { podcastId: podcast.id }, individualHooks: true })
      }
    }
  });

  podcast.associate = function(models) {
    podcast.hasMany(models.episode, {
      onDelete: 'cascade',
      hooks: true,
    });
    podcast.belongsTo(models.user)
  };
  return podcast;
};
