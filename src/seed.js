const db = require('./models');
const Op = db.Sequelize.Op;

const users = [
  {
    username: "ryan",
    password: "tyryky",
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
  {
    username: "jim",
    password: "password",
    email: "email@email.com"
  }
]

function randomNum() {
  return Math.floor(10 * Math.random())
}

const User = db.user;
const Follows = db.follows;
const Rek = db.rek;

User.destroy({
  where: {},
})

Follows.destroy({
  where: {},
})

Rek.destroy({
  where: {},
})


// users.forEach((user) => {
//   User.create(user)
// })

// Follows.create({ followerId: 1, followeeId: 2 })
// Follows.create({ followerId: 1, followeeId: 3 })
// Follows.create({ followerId: 2, followeeId: 1 })
// Follows.create({ followerId: 2, followeeId: 3 })
// Follows.create({ followerId: 3, followeeId: 1 })
// Follows.create({ followerId: 3, followeeId: 2 })

