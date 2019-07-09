'use strict';
module.exports = (sequelize, DataTypes) => {
  const rek = sequelize.define('rek', {
    userId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    satoshis: DataTypes.INTEGER,
    invoice: DataTypes.TEXT,
    invoiceId: DataTypes.TEXT,
    paid: DataTypes.BOOLEAN
  }, {});
  rek.associate = function(models) {
    rek.belongsTo(models.user)
    rek.belongsTo(models.episode)
  };
  return rek;
};
