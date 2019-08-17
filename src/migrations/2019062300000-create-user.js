'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      satoshis: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        isEmail: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.STRING,
      },
      walletPermission: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      profilePic: {
        type: Sequelize.STRING
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
    return queryInterface.dropTable('users');
  }
};
