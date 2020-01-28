'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('episodes', 'content', {
      type: Sequelize.DataTypes.TEXT
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('episodes', 'content', {
      type: Sequelize.DataTypes.TEXT
    });
  }
};
