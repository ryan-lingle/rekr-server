const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { AuthenticationError } = require('apollo-server-express');
const Jwt = require("./auth/jwt")
const { pubsub } = require('./pubsub');
const { sendConfirmationEmail } = require('./datasources/mailer');

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
    followedHashtags: async (parent, _, { DB }) => {
      return await parent.getFollowedHashtags();
    },
    followedByCurrentUser: async (parent, _, { DB, id }) => {
      const UserFollow = DB.user_follow;
      const exists = await UserFollow.findOne({ where: { followerId: id, followeeId: parent.id }})
      return exists != null;
    }
  },
  Podcast: {
    episodes: async (parent, _, { DB }) => {
      if (parent.episodes) {
        return parent.episodes;
      } else {
        const Episode = DB.episode;
        return Episode.findAll({ where: { podcastId: parent.id }, order: [['released', 'DESC']]});
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
    parents: async (parent, _, { DB }) => {
      const Rek = DB.rek;
      const rek = await Rek.findByPk(parent.id);
      return await rek.getParents();
    },
    children: async (parent, _, { DB }) => {
      const Rek = DB.rek;
      const rek = await Rek.findByPk(parent.id);
      return await rek.getChildren();
    },
    hashtags: async (parent, _, { DB }) => {
      return await parent.getHashtags();
    },
  },
  Hashtag: {
    reks: async (parent, _, { DB }) => {
      const reks = await parent.getReks();
      return { stream: reks }
    },
    followedByCurrentUser: async (parent, _, { DB, id }) => {
      const HashtagFollow = DB.hashtag_follow;
      const exists = await HashtagFollow.findOne({ where: { hashtagId: parent.id, followerId: id }})
      return exists != null;
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
      return new Date(value);
    },
    parseLiteral(ast) {
      return parseInt(ast.value); // ast value is always in string format
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
    hashtag: async (args, { DB }) => {
      const Hashtag = DB.hashtag;
      return await Hashtag.findOne({ where: args });
    },
    hashtagFeed: async ({ name, n }, { DB }) => {
      const Hashtag = DB.hashtag;
      const hashtag = await Hashtag.findOne({ where: { name } });
      const offset = n ? n * 10 : 0;
      return await hashtag.getFeed({ offset });
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
    search: async ({ term, type, n }, { DB }) => {
      const offset = n ? n * 10 : 0;
      const Model = DB[type];
      const stream = await Model.search({ term, offset });
      const more = stream.length == 10;
      const response = {};
      response[type] = { stream, more };
      return response;
    },
    podcast: async (args, { DB }) => {
      const Podcast = DB.podcast;
      return await Podcast.findOne({ where: args })
    }
  },
  Mutation: {
    parsePodcast: async ({ rssUrl }, { dataSources, id }) => {
      const { RssFeed } = dataSources;
      const feed = new RssFeed(rssUrl);
      return await feed.toPodcast()
    },
    deposit: async ({ satoshis }, { dataSources, id, DB }) => {
      const user = await DB.user.findByPk(id);
      const { getInvoice } = dataSources.Lightning;
      const invoice = await getInvoice(satoshis, async (invoice) => {
        user.satoshis += satoshis;
        await user.save();
        pubsub.publish('INVOICE_PAID', { userId: id, invoice })
      });
      return { invoice, satoshis }
    },
    withdraw: async ({ invoice }, { dataSources, id, DB }) => {
      const user = await DB.user.findByPk(id);
      const { withdraw } = dataSources.Lightning;
      const res = await withdraw(invoice, user.satoshis);
      if (res.success) {
        user.satoshis = user.satoshis - res.satoshis;
        await user.save();
      }
      return res;
    },
    toggleFollow: async ({ type, ...args}, { DB, id }) => {
      const Model = DB[`${type}_follow`];
      args.followerId = id;

      const exists = await Model.findOne({ where: args})
      if (exists == null) {
        await Model.create(args)
        return true;
      } else {
        await Model.destroy({ where: args});
        return false;
      }
    },
    createRek: async ({ episodeId, tags, walletSatoshis = 0, invoiceSatoshis = 0 }, { DB, dataSources, id }) => {
      const Rek = DB.rek;

      const rek = {
        episodeId,
        userId: id,
      }

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
          rek.valueGenerated = rek.satoshis;
          await Rek.create(rek);
          pubsub.publish('INVOICE_PAID', { userId: id, invoice })
        });
      } else {
        user.satoshis = user.satoshis - walletSatoshis;
        await user.save();

        rek.satoshis = walletSatoshis;
        rek.valueGenerated = rek.satoshis;

        const newRek = await Rek.create(rek);
        await newRek.addTags(tags);
        return newRek;
      }

      return { invoice, satoshis: invoiceSatoshis }
    },
    createRekView: async ({ rekId }, { DB, id }) => {
      const RekView = DB.rek_view;
      const rek_view = await RekView.findOrCreate({ where: { rekId, userId: id } })
      return rek_view[0];
    },
    updateUser: async (args, { DB, id, dataSources }) => {
      const User = DB.user;
      const { uploadFile } = dataSources.Images;
      const { createReadStream } = await args.profilePic;
      const stream = createReadStream();
      const { Location } = await uploadFile(stream);

      const user = await User.update({ profilePic: Location }, { where: { id }});
      return await User.findByPk(id);
    },
    createUser: async (_, { email, username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.create({ email, username, password });
      const id = user.id;
      const token = Jwt.sign(id.toString());
      return { id, token, username: user.username, profilePic: user.profilePic }
    },
    logIn: async (_, { username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.findOne({ where: { username }});
      if (!user) {
        throw new Error('Invalid Username or Password.');
      } else if (!await user.validPassword(password)) {
        throw new Error('Invalid Username or Password.');
      } else {
        const id = user.id;
        const token = Jwt.sign(id.toString());
        return { id, token, username: user.username, profilePic: user.profilePic }
      }
    },
    createPodcast: async ({ title,rss,description,email,website,image }, { dataSources, DB, id }) => {
      const { ListenNotes, RssFeed } = dataSources;
      const Podcast = DB.podcast;
      const Episode = DB.episode;

      // const itunesId = await ListenNotes.itunesIdByRss(rss);

      const podcasts = await Podcast.findOrCreate({ where: {
        title, description, rss, email,
        website, image, userId: id
      }});

      return podcasts[0];
    },
    createEpisodes: async ({ episodes, podcastId }, { DB }) => {
      const Episode = DB.episode;
      console.log(episodes)
      episodes = await Promise.all(episodes.map(async episode => {
        console.log(episode);
        return await Episode.create({
          podcastId: podcastId, title: episode.title,
          description: episode.description, released: episode.released
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
    confirmEmail: async (_, { token }, { DB }) => {
      const User = DB.user;
      const Podcast = DB.podcast;

      const user = await User.findOne({ where: { token }});
      if (user) {
        user.emailVerified = true;
        await user.save();
        return { user };
      }

      const podcast = await Podcast.findOne({ where: { token }});
      if (podcast) {
        podcast.emailVerified = true;
        await podcast.save();
        return { podcast };
      }
    },
    resendConfirmEmail: async (_, __, { id, DB }) => {
      const User = DB.user;
      const user = await User.findByPk(id);
      await sendConfirmationEmail(user);
      return true;
    }
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
