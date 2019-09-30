'use strict';
module.exports = (sequelize, DataTypes) => {
  const rek_update = sequelize.define('rek_update', {
    rekId: DataTypes.INTEGER,
    satoshis: DataTypes.INTEGER,
    removeAt: DataTypes.DATE,
  }, {
    hooks: {
      beforeCreate: async function(rek_update) {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        // const oneMinuteFromNow = new Date(date.getTime() + 60000);
        rek_update.removeAt = date;
      }
    }
  });
  rek_update.associate = function(models) {
    rek_update.belongsTo(models.rek);
  };
  return rek_update;
};
