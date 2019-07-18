const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { AuthenticationError } = require('apollo-server-express');
const Jwt = require("./auth/jwt")
const { pubsub } = require('./pubsub');

module.exports = {
  User: {
    podcasts: async (parent, _, { DB }) => {
      const Podcast = DB.podcast;
      return await Podcast.findAll({ where: { userId: parent.id }});
    },
    reks: async (parent, _, { DB }) => {
      const Rek = DB.rek;
      return await Rek.findAll({ where: { userId: parent.id }, order: [['id', 'DESC']]});
    },
    feed: async (parent, _, { DB, id }) => {
      const User = DB.user;
      const user = await User.findByPk(parent.id);
      return await user.getFeed();
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
    createRek: async ({ episodeId, satoshis }, { DB, dataSources, id }) => {
      const Rek = DB.rek;
      const { getInvoice, subscribeInvoice } = dataSources.Lightning;
      const invoice = await getInvoice(satoshis);
      return await Rek.create({
        episodeId, satoshis,
        invoice: invoice.request,
        invoiceId: invoice.id,
        userId: id, paid: false
      })
    },
    createUser: async (_, { email, username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.create({ email, username, password });
      const id = user.id;
      const token = Jwt.sign(id.toString());
      return { id, token }
    },
    logIn: async (_, { username, password }, { DB }) => {
      const User = DB.user;
      const user = await User.findOne({ where: { username }});
      if (!user) {
        throw new AuthenticationError('Invalid Username or Password.');
      } else if (!await user.validPassword(password)) {
        throw new AuthenticationError('Invalid Username or Password.');
      } else {
        const id = user.id;
        const token = Jwt.sign(id.toString());
        return { id, token }
      }
    },
    createPodcast: async ({ title,rss,description,email,website,image,episodes }, { dataSources, DB, id }) => {
      const { ListenNotes } = dataSources;
      const Podcast = DB.podcast;
      const Episode = DB.episode;

      const itunesId = await ListenNotes.itunesIdByRss(rss);
      const userId = id;
      const podcast = await Podcast.create({
        title, description, rss, email,
        website, image, itunesId, userId
      });

      // create episodes
      episodes.forEach(episode => Episode.create({
        podcastId: podcast.id, title: episode.title,
        description: episode.description, released: episode.released
      }))

      return podcast;
    }
  },
  Subscription: {
    invoicePaid: {
      resolve: ({ rek }) => {
        return rek;
      },
      subscribe: () => pubsub.asyncIterator(["INVOICE_PAID"]),
    }
  }
}
