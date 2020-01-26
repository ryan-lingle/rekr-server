require('dotenv').config()
const express = require('express');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const { createServer } = require('http');
const typeDefs = require('./schema');

const DB = require('./models');
const resolvers = require('./resolvers');

const ItunesApi = require('./datasources/itunes');
const RssFeed = require('./datasources/rss_feed');
const ListenNotes = require('./datasources/listen_notes');
const Lightning = require('./datasources/lnd');
const Images = require('./datasources/images');
const Twitter = require('./datasources/twitter');
const { AuthenticationDirective, AuthorizationDirective } = require('./auth/auth_directive');
const Jwt = require("./auth/jwt");
const { adminController } = require("./admin");
const app = express();

// initialize some admin routes (don't forget to setup auth)
adminController(app);

const server = new ApolloServer({
  context: async ({ req, connection }) => {
    if (connection) {
      const { token, id } = connection.context;
      if (id && !Jwt.verify(token, id)) {
        throw new AuthenticationError("UNAUTHENTICATED")
      }
      return { ...connection.context, DB }
    } else {
      const { token, id } = req.headers;
      return { DB, token, id };
    }
  },
  typeDefs,
  resolvers,
  schemaDirectives: {
    authenticate: AuthenticationDirective,
    authorize: AuthorizationDirective
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


httpServer.listen(process.env.PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${process.env.PORT}${server.subscriptionsPath}`);
});

if (process.env.NODE_ENV !== "development") {
  const Rollbar = require("rollbar");
  const rollbar = new Rollbar({
    accessToken: '5826c0ce0cee42f18b5e705ece852051',
    captureUncaught: true,
    captureUnhandledRejections: true
  });
};

