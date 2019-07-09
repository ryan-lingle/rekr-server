'use strict';
module.exports = (sequelize, DataTypes) => {
  const episode = sequelize.define('episode', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    podcastId: DataTypes.INTEGER,
    itunesId: DataTypes.INTEGER,
  }, {});
  episode.associate = function(models) {
    episode.belongsTo(models.podcast);
    episode.hasMany(models.rek);
  };

  episode.search = async function(term) {
    const searchResults = await sequelize.query(`
      SELECT *
      FROM ${this.tableName}
      WHERE _search @@ plainto_tsquery('english', :query);
    `, {
      model: this,
      replacements: { query: term },
    });
    return searchResults;
  }

  return episode;
};
