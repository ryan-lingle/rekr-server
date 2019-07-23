const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { AuthenticationError } = require('apollo-server-express');
const Jwt = require("./auth/jwt")
const { pubsub } = require('./pubsub');

module.exports = {
  User: {
    current: async(parent, _, { id }) => {
      return parent.id == id;
    },
    podcasts: async (parent, _, { DB }) => {
      const Podcast = DB.podcast;
      return await Podcast.findAll({ where: { userId: parent.id }});
    },
    reks: async (parent, _, { DB }) => {
      const Rek = DB.rek;
      const count = await Rek.count({ where: { userId: parent.id } });
      const stream = await Rek.findAll({ where: { userId: parent.id }, order: [['id', 'DESC']], limit: 10 });
      const more = stream.length == 10;
      return { stream, more, count };
    },
    feed: async (parent, _, { DB }) => {
      const User = DB.user;
      const user = await User.findByPk(parent.id);
      return await user.getFeed({});
    },
    bookmarks: async (parent, _, { DB }) => {
      const Bookmark = DB.bookmark;
      const count = await Bookmark.count({ where: { userId: parent.id } });
      const stream = await Bookmark.findAll({ where: { userId: parent.id }, order: [['id', 'DESC']], limit: 10});
      const more = stream.length == 10;
      return { stream, more, count };
    },
    rek_views: async (parent, _, { DB }) => {
      const RekView = DB.rek_view;
      return await RekView.findAll({ where: { userId: parent.id }});
    },
    followedByCurrentUser: async (parent, _, { DB, id }) => {
      const Follows = DB.follows;
      const exists = await Follows.findOne({ where: { followerId: id, followeeId: parent.id }})
      return exists != null;
    }
  },
  Podcast: {
    episodes: async (parent, _, { DB }) => {
      if (parent.episodes) {
        return parent.episodes;
      } else {
        const Episode = DB.episode;
        return Episode.findAll({ where: { podcastId: parent.id }});
      }
    }
  },
  Episode: {
    podcast: async (parent, _, { DB }) => {
      const Podcast = DB.podcast;
      return await Podcast.findByPk(parent.podcastId);
    },
    bookmarked: async (parent, _, { DB, id }) => {
      const Bookmark = DB.bookmark;
      const exists = await Bookmark.findOne({ where: { episodeId: parent.id, userId: id }})
      return exists != null;
    }
  },
  Rek: {
    episode: async (parent, _, { DB }) => {
      const Episode = DB.episode;
      return await Episode.findByPk(parent.episodeId);
    },
    user: async (parent, _, { DB }) => {
      const User = DB.user;
      return await User.findByPk(parent.userId);
    },
    parent: async(parent, _, { DB }) => {
      const Rek = DB.rek;
      return await Rek.findByPk(parent.parentId);
    }
  },
  Bookmark: {
    episode: async (parent, _, { DB }) => {
      const Episode = DB.episode;
      return await Episode.findByPk(parent.episodeId);
    },
    user: async (parent, _, { DB }) => {
      const User = DB.user;
      return await User.findByPk(parent.userId);
    }
  },
  RekView: {
    rek: async (parent, _, { DB }) => {
      const Rek = DB.rek;
      return await Rek.findByPk(parent.rekId);
    }
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      const date = new Date(value);
      return date.toLocaleDateString({ month: "long", day: "numeric", year: "long" });
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    users: async ({ n, userId, followers, following }, { DB }) => {
      const User = DB.user;
      const user = await User.findByPk(userId);
      const offset = n ? n * 10 : 0;
      if (followers) {
        const stream = await user.getFollowers({ limit: 10, offset });
        const more = stream.length == 10;
        return { stream, more };
      }

      if (following) {
        const stream = await user.getIsFollowing({ limit: 10, offset });
        const more = stream.length == 10;
        return { stream, more };
      }
    },
    reks: async ({ n, userId, feed }, { DB, id }) => {
      const offset = n ? n * 10 : 0;
      if (feed) {
        const User = DB.user;
        const user = await User.findByPk(id);
        return await user.getFeed({ offset });
      } else {
        const Rek = DB.rek;
        const stream = await Rek.findAll({ where: { userId }, order: [['id', 'DESC']], offset, limit: 10, });
        const more = stream.length == 10;
        return { stream, more }
      }
    },
    bookmarks: async ({ n, userId }, { DB, id }) => {
      const Bookmark = DB.bookmark;
      const offset = n ? n * 10 : 0;
      userId = userId || id;
      const stream = await Bookmark.findAll({ where: { userId }, order: [['id', 'DESC']], offset, limit: 10, });
      const more = stream.length == 10;
      return { stream, more }
    },
    parsePodcast: async ({ rssUrl }, { dataSources, id }) => {
      const { RssFeed } = dataSources;
      const feed = new RssFeed(rssUrl);
      return await feed.toPodcast()
    },
    currentUser: async (_, { DB, id }) => {
      const User = DB.user;
      return await User.findByPk(id)
    },
    user: async  (args, { DB }) => {
      const User = DB.user;
      return await User.findOne({ where: args });
    },
    allUsers: async (__, { DB }) => {
      const User = DB.user;
      return await User.findAll()
    },
    episode: async ({ id }, { DB }) => {
      const Episode = DB.episode;
      return await Episode.findByPk(id);
    },
    searchEpisodes: async ({ term }, { DB }) => {
      const Episode = DB.episode;
      return await Episode.search(term);
    }
  },
  Mutation: {
    withdrawInvoice: async ({ satoshis }, { dataSources, id, DB }) => {
      const user = await DB.user.findByPk(id);
      const { getInvoice } = dataSources.Lightning;
      const invoice = await getInvoice(satoshis, async (invoice) => {
        user.satoshis += satoshis;
        await user.save();
        pubsub.publish('INVOICE_PAID', { userId: id, invoice })
      });
      return { invoice, satoshis }
    },
    toggleFollow: async ({ userId }, { DB, id }) => {
      const Follows = DB.follows;
      const exists = await Follows.findOne({ where: { followerId: id, followeeId: userId }})
      if (exists == null) {
        await Follows.create({ followerId: id, followeeId: userId })
        return true;
      } else {
        await Follows.destroy({ where: { followerId: id, followeeId: userId }});
        return false;
      }
    },
    createRek: async ({ episodeId, walletSatoshis = 0, invoiceSatoshis = 0 }, { DB, dataSources, id }) => {
      const Rek = DB.rek;

      const rek = {
        episodeId,
        userId: id,
      }
      console.log("wallet:")
      console.log(walletSatoshis)
      console.log("invoice:")
      console.log(invoiceSatoshis)

      // remove wallet satoshis
      const User = DB.user;
      const user = await User.findByPk(id);

      let invoice;
      if (invoiceSatoshis > 0) {
        const { getInvoice } = dataSources.Lightning;
        invoice = await getInvoice(invoiceSatoshis, async (invoice) => {
          user.satoshis = user.satoshis - walletSatoshis;
          await user.save();

          rek.invoice = invoice;
          rek.satoshis = invoiceSatoshis + walletSatoshis;
          await Rek.create(rek);
          pubsub.publish('INVOICE_PAID', { userId: id, invoice })
        });
      } else {
        user.satoshis = user.satoshis - walletSatoshis;
        await user.save();

        rek.satoshis = walletSatoshis;
        return await Rek.create(rek);
      }

      return { invoice, satoshis: invoiceSatoshis }
    },
    createRekView: async ({ rekId }, { DB, id }) => {
      const RekView = DB.rek_view;
      const rek_view = await RekView.findOrCreate({ where: { rekId, userId: id } })
      return rek_view[0];
    },
    createUser: async (_, { email, username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.create({ email, username, password });
      const id = user.id;
      const token = Jwt.sign(id.toString());
      return { id, token, username: user.username }
    },
    logIn: async (_, { username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.findOne({ where: { username }});
      if (!user) {
        throw new error('Invalid Username or Password.');
      } else if (!await user.validPassword(password)) {
        throw new error('Invalid Username or Password.');
      } else {
        const id = user.id;
        const token = Jwt.sign(id.toString());
        return { id, token, username: user.username }
      }
    },
    createPodcast: async ({ title,rss,description,email,website,image }, { dataSources, DB, id }) => {
      const { ListenNotes } = dataSources;
      const Podcast = DB.podcast;
      const Episode = DB.episode;

      const itunesId = await ListenNotes.itunesIdByRss(rss);
      const userId = id;
      const podcast = await Podcast.findOrCreate({ where: {
        title, description, rss, email,
        website, image, itunesId, userId
      }});

      return podcast[0];
    },
    createEpisodes: async ({ episodes, podcastId }, { DB }) => {
      const Episode = DB.episode;
      episodes = await Promise.all(episodes.map(episode => {
        Episode.findOrCreate({
          where: {
              podcastId: podcastId, title: episode.title,
              description: episode.description, released: episode.released
          }
        })
      }));
      return episodes.flat();
    },
    createBookmark: async ({ episodeId }, { DB, id }) => {
      const Bookmark = DB.bookmark;
      const bookmark = await Bookmark.create({ episodeId, userId: id })
      return { bookmarkExists: true, bookmark }
    },
    destroyBookmark: async ({ episodeId }, { DB, id }) => {
      const Bookmark = DB.bookmark;
      await Bookmark.destroy({ where: { episodeId, userId: id }})
      return { bookmarkExists: false }
    },
  },
  Subscription: {
    invoicePaid: {
      resolve: (invoicePaid) => {
        return invoicePaid;
      },
      subscribe: () => pubsub.asyncIterator(["INVOICE_PAID"]),
    }
  }
}
