'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('reks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'users',
          },
          key: 'id'
        },
        allowNull: false
      },
      episodeId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'episodes',
          },
          key: 'id'
        },
        allowNull: false
      },
      valueGenerated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      satoshis: {
        type: Sequelize.INTEGER
      },
      invoice: {
        type: Sequelize.TEXT
      },
      invoiceId: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('reks');
  }
};
