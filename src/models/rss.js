'use strict';
module.exports = (sequelize, DataTypes) => {
  const rss = sequelize.define('rss', {
    url: DataTypes.STRING
  }, {});
  rss.associate = function(models) {
    // associations can be defined here
  };
  return rss;
};