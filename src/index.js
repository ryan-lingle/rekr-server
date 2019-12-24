require('dotenv').config()
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
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
const { adminData } = require('./datasources/admin');

const { AuthenticationDirective, AuthorizationDirective } = require('./auth/auth_directive');
const Jwt = require("./auth/jwt");

const app = express();
app.use(cors());

app.get("/admin/api", async (req, res) => {
  const data = await adminData(req);
  res.set("Access-Control-Allow-Credentials", true);
  res.send(data);
});

const { rssUpdater, valueGeneratedUpdater } = require('./jobs');

rssUpdater();
valueGeneratedUpdater();

const server = new ApolloServer({
  context: async ({ req, connection }) => {
    if (connection) {
      const { token, id } = connection.context;
      if (!Jwt.verify(token, id)) {
        throw new AuthenticationError("AUTH")
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

