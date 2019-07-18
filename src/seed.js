const db = require('./models');
const RssFeed = require('./datasources/rss_feed');

const users = [
  {
    username: "user",
    password: "password",
    email: "email@email.com"
  },
  {
    username: "ryan",
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

const User = db.user;
const Follows = db.follows;
const Rek = db.rek;
const Podcast = db.podcast;
const Episode = db.episode;


(async function() {

  await destroyItAll();

  await createUsers();

  await createPodcast();

  await createReks();

  await followEachOther();

})()












async function destroyItAll() {
  console.log('Destroying Users')
  await User.destroy({
    where: {},
    individualHooks: true,
  })
  await Follows.destroy({
    where: {},
    individualHooks: true,
  })
}

async function createUsers() {
  console.log('Creating Users')
  users.forEach(async (user) => {
    await User.create(user)
  })
}

async function followEachOther() {
  console.log('Users are following Each Other')
  User.findAll().then(users => {
    users.forEach((user) => {
      users.forEach((_user_) => {
        user.follow(_user_.id)
      })
    })
  })
}

// async function seeFollowers() {
//   User.findAll().then(users => {
//     console.log(user.getFollowers())
//   })
// }

async function createPodcast() {
  console.log('Create a Podcast')
  const feed = new RssFeed("http://feeds.soundcloud.com/users/soundcloud:users:343665466/sounds.rss");
  const {title, description, rss, email, website, image, episodes } = await feed.toPodcast();
  const me = await User.findOne({ where: { username: "ryan" }});
  const userId = me.id;

  const podcast = await Podcast.create({
    title, description, rss, email,
    website, image, userId
  });

  console.log('Creating Episodes')
  episodes.forEach(async (episode) => {
    await Episode.create({
      podcastId: podcast.id, title: episode.title,
      description: episode.description, released: episode.released
    })
  })
}

async function createReks() {
  console.log('Creating Reks')
  const _users = await User.findAll();
  User.findAll().then(users => {
    users.forEach(async (user) => {
      for (let i=1;i<=10; i++) {
        const episode = await Episode.findOne({ order: db.Sequelize.fn('RANDOM') })
        const rek = {
          episodeId: episode.id,
          satoshis: randomSats(),
          userId: user.id,
          paid: true,
        }

        Rek.create(rek)
      }
    })
  })

}

function randomSats() {
  return Math.floor(50 * Math.random()) + 50;
}

