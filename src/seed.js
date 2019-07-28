const db = require('./models');
const RssFeed = require('./datasources/rss_feed');

const users = [
  {
    username: "i_amm_nobody",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/i_amm_nobody.jpg"
  },
  {
    username: "PeterMcCormack",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/PeterMcCormack.png"
  },
  {
    username: "bitstein",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/bitstein.jpg"
  },
  {
    username: "pierre_rochard",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/pierre_rochard.jpg"
  },
  {
    username: "MartyBent",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/MartyBent.jpg"
  },
  {
    username: "matt_odell",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/matt_odell.jpg"
  },
  {
    username: "stephanlivera",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/stephanlivera.jpg"
  },
  {
    username: "joerogan",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/joerogan.jpeg"
  },
  {
    username: "EricRWeinstein",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/EricRWeinstein.jpg"
  },
  {
    username: "NickSzabo4",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/NickSzabo4.jpg"
  },
  {
    username: "lopp",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/lopp.jpg"
  },
  {
    username: "TuurDemeester",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/TuurDemeester.png"
  },
  {
    username: "naval",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/naval.png"
  },
  {
    username: "brady",
    password: "password",
    email: "email@email.com",
    profilePic: "https://rekr-profile-pics.sfo2.digitaloceanspaces.com/brady.png"
  }
]

const podcasts = [
  {
    rss: "http://feeds.soundcloud.com/users/soundcloud:users:343665466/sounds.rss",
    owner: "bitstein"
  },
  {
    rss: "https://feeds.simplecast.com/620_gQYv",
    owner: "brady"
  },
  {
    rss: "https://feeds.megaphone.fm/KM4602122913",
    owner: "EricRWeinstein"
  },
  {
    rss: "http://joeroganexp.joerogan.libsynpro.com/rss",
    owner: "joerogan"
  },
  {
    rss: "https://anchor.fm/s/558f520/podcast/rss",
    owner: "MartyBent"
  },
  {
    rss: "https://www.whatbitcoindid.com/podcast?format=RSS",
    owner: "PeterMcCormack"
  },
  {
    rss: "https://www.listennotes.com/c/r/9aa0e4180a0340768f58f357bff1243b",
    owner: "stephanlivera"
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

  await createPodcasts();

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
  for (const user of users) {
    await User.create(user)
  }
}

async function followEachOther() {
  console.log('Users are following Each Other')
  const users = await User.findAll();
  for (const user of users) {
    for (const _user_ of users) {
      try {
        await user.follow(_user_.id);
      } catch(err) {
        console.log(err)
      }
    }
  }
}

async function createPodcasts() {
  for (const podcast of podcasts) {
    await createPodcast(podcast)
  }
}

async function createPodcast(podcast) {
  console.log('Creating a Podcast')
  const feed = new RssFeed(podcast.rss);
  const {title, description, rss, email, website, image, episodes } = await feed.toPodcast();
  console.log(podcast.owner)
  const owner = await User.findOne({ where: { username: podcast.owner }});
  const userId = owner.id;

  const _podcast_ = await Podcast.create({
    title, description, rss, email,
    website, image, userId
  });

  console.log('Creating Episodes')
  for (const episode of episodes) {
    await Episode.create({
      podcastId: _podcast_.id, title: episode.title,
      description: episode.description, released: episode.released
    })
  }
}

async function createReks() {
  console.log('Creating Reks')
  const users = await User.findAll();

  for (const user of users) {
    for (let i=1;i<=15; i++) {
      const podcast = await Podcast.findOne({ order: db.Sequelize.fn('RANDOM') })
      const episode = await Episode.findOne({ order: db.Sequelize.fn('RANDOM'), where: { podcastId: podcast.id } })
      const sats = randomSats();
      const rek = {
        episodeId: episode.id,
        satoshis: sats,
        userId: user.id,
        valueGenerated: sats
      }

      await Rek.create(rek)
    }
  }

}

function randomSats() {
  return Math.floor(10000 * Math.random());
}

