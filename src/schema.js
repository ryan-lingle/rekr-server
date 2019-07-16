const { gql } = require('apollo-server-express');

const typeDefs = gql`
  directive @requireAuth on FIELD_DEFINITION

  scalar Date

  type User {
    id: ID!
    username: String!
    email: String
    password: String
    podcasts: [Podcast]
    reks: [Rek]
  }

  type Episode {
    id: ID
    podcast: Podcast
    title: String
    description: String
    released: Date
  }

  type Podcast {
    id: ID
    title: String
    rss: String
    description: String
    email: String
    website: String
    image: String
    itunesId: Int!
    episodes: [Episode]
  }

  type Rek {
    user: User!
    episode: Episode!
    satoshis: Int!
    invoice: String!
    invoiceId: String!
    paid: Boolean!
  }

  type LogInResponse {
    id: ID!
    token: String!
  }

  input EpisodeInput {
    title: String
    description: String
    released: Date
  }

  type Subscription {
    invoicePaid(id: String!): Rek!
  }

  type Query {
    parsePodcast(rssUrl: String!): Podcast! @requireAuth
    allUsers: [User] @requireAuth
    currentUser: User! @requireAuth
    user(username: String): User! @requireAuth
    episode(id: Int!): Episode! @requireAuth
    searchEpisodes(term: String!): [Episode] @requireAuth
  }

  type Mutation {
    createRek(episodeId: Int!, satoshis: Int!) : Rek! @requireAuth
    createPodcast(title: String, rss: String, description: String, email: String, website: String, image: String, episodes: [EpisodeInput]): Podcast! @requireAuth
    createUser(email: String!, username: String!, password: String!): LogInResponse!
    logIn(username: String!, password: String!): LogInResponse!
  }
`;

module.exports = typeDefs;
