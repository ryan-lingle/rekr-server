const { gql } = require('apollo-server-express');

const typeDefs = gql`
  directive @requireAuth on FIELD_DEFINITION

  scalar Date

  type UserStream {
    lastId: Int!
    more: Boolean
    stream: [User]
    count: Int!
  }

  type RekStream {
    lastId: Int
    more: Boolean
    stream: [Rek]
    count: Int!
  }

  type BookmarkStream {
    lastId: Int!
    more: Boolean
    stream: [Bookmark]
    count: Int!
  }

  type User {
    id: ID!
    current: Boolean!
    satoshis: Int!
    username: String!
    email: String
    password: String
    podcasts: [Podcast]
    reks: RekStream!
    bookmarks: BookmarkStream!
    followers: UserStream!
    following: UserStream!
    feed: RekStream!
    rek_views: [RekView]
    followedByCurrentUser: Boolean!
  }

  type Episode {
    id: ID
    podcast: Podcast
    title: String
    description: String
    bookmarked: Boolean
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
    itunesId: Int
    episodes: [Episode]
  }

  type Rek {
    id: Int!
    user: User!
    parent: Rek
    episode: Episode!
    satoshis: Int!
    invoice: String
  }

  type RekView {
    id: Int!
    user: User!
    rek: Rek!
  }

  type Bookmark {
    id: Int!
    user: User!
    episode: Episode!
  }

  type BookmarkResponse {
    bookmarkExists: Boolean!
    bookmark: Bookmark
  }

  type InvoiceResponse {
    invoice: String!
    satoshis: Int!
    invoiceId: String!
  }

  type LogInResponse {
    id: ID!
    token: String!
    username: String!
  }

  input EpisodeInput {
    title: String!
    description: String!
    released: String!
  }

  type Invoice {
    satoshis: Int
    invoice: String
  }

  type InvoicePaid {
    userId: Int!
    invoice: String!
  }

  type Subscription {
    invoicePaid(invoice: String!): InvoicePaid!
  }

  type Query {
    parsePodcast(rssUrl: String!): Podcast! @requireAuth
    allUsers: [User] @requireAuth
    currentUser: User! @requireAuth
    user(username: String): User! @requireAuth
    episode(id: Int!): Episode! @requireAuth
    searchEpisodes(term: String!): [Episode] @requireAuth
    reks(n: Int!, userId: Int, feed: Boolean): RekStream! @requireAuth
    users(n: Int!, userId: Int, followers: Boolean, following: Boolean): UserStream! @requireAuth
    bookmarks(n: Int!, userId: Int): BookmarkStream! @requireAuth
  }

  type Mutation {
    withdrawInvoice(satoshis: Int!): Invoice! @requireAuth
    toggleFollow(userId: Int!): Boolean! @requireAuth
    createRekView(rekId: Int!): RekView! @requireAuth
    createBookmark(episodeId: Int!): BookmarkResponse! @requireAuth
    destroyBookmark(episodeId: Int!): BookmarkResponse! @requireAuth
    createRek(episodeId: String!, walletSatoshis: Int, invoiceSatoshis: Int): Invoice! @requireAuth
    createPodcast(title: String, rss: String, description: String, email: String, website: String, image: String): Podcast! @requireAuth
    createEpisodes(episodes: [EpisodeInput], podcastId: String!): [Episode] @requireAuth
    createUser(email: String!, username: String!, password: String!): LogInResponse!
    logIn(username: String!, password: String!): LogInResponse!
  }
`;

module.exports = typeDefs;
