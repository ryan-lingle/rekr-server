'use strict';
const users = [
  {
    username: "ryan",
    password: "password",
    email: "lingleryan@gmail.com"
  },
  {
    username: "john",
    password: "password",
    email: "email@email.com"
  },
  {
    username: "paul",
    password: "password",
    email: "email@email.com"
  },
]

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('users', users, {});

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};
