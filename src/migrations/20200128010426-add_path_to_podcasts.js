'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('podcasts', 'path', {
      type: Sequelize.DataTypes.TEXT
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('podcasts', 'path', {
      type: Sequelize.DataTypes.TEXT
    });
  }
};
