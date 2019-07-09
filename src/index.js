require('dotenv').config()
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const typeDefs = require('./schema');

const resolvers = require('./resolvers');
const DB = require('./models');

const ItunesApi = require('./datasources/itunes');
const RssFeed = require('./datasources/rss_feed');
const ListenNotes = require('./datasources/listen_notes');
const Lightning = require('./datasources/lnd');

const AuthDirective = require('./auth/auth_directive');

const { pubsub } =require('./pubsub');


const server = new ApolloServer({
  context: async ({ req, connection }) => {
    if (connection) {
      return connection.context;
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
    Itunes: new ItunesApi(),
    ListenNotes: new ListenNotes(),
  })
});

const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
