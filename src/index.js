require('dotenv').config()
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const typeDefs = require('./schema');

const resolvers = require('./resolvers');
const DB = require('./models');

const ItunesApi = require('./datasources/itunes');
const RssFeed = require('./datasources/rss_feed');
const ListenNotes = require('./datasources/listen_notes');
const Lightning = require('./datasources/lnd');
const Images = require('./datasources/images');
const Twitter = require('./dataSources/twitter');

const AuthDirective = require('./auth/auth_directive');

const PORT = 4000;
const app = express();

const server = new ApolloServer({
  context: async ({ req, connection }) => {
    if (connection) {
      return { connection: connection.context, DB }
    } else {
      const { token, id } = req.headers;
      return { DB, token, id };
    }
  },
  typeDefs,
  resolvers,
  schemaDirectives: {
    requireAuth: AuthDirective
  },
  dataSources: () => ({
    RssFeed,
    Lightning,
    Images,
    Twitter,
    Itunes: new ItunesApi(),
    ListenNotes: new ListenNotes(),
  })
});

server.applyMiddleware({
  app
});

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);


httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});
