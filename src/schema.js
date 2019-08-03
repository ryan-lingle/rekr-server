const { gql } = require('apollo-server-express');

const typeDefs = gql`
  directive @requireAuth on FIELD_DEFINITION

  scalar Date

  type UserStream {
    more: Boolean
    stream: [User]
    count: Int!
  }

  type RekStream {
    more: Boolean
    stream: [Rek]
    count: Int!
  }

  type BookmarkStream {
    more: Boolean
    stream: [Bookmark]
    count: Int!
  }

  type EpisodeStream {
    more: Boolean
    stream: [Episode]
    count: Int!
  }

  type PodcastStream {
    more: Boolean
    stream: [Podcast]
    count: Int!
  }

  type HashtagStream {
    more: Boolean
    stream: [Hashtag]
    count: Int!
  }

  type User {
    id: ID!
    current: Boolean!
    satoshis: Int!
    username: String!
    email: String
    password: String
    profilePic: String
    podcasts: [Podcast]
    reks: RekStream!
    bookmarks: BookmarkStream!
    followers: UserStream!
    following: UserStream!
    feed: RekStream!
    rek_views: [RekView]
    followedHashtags: [Hashtag]
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
    slug: String
    episodes: [Episode]
  }

  type Rek {
    id: ID
    user: User!
    parents: [Rek]
    children: [Rek]
    episode: Episode!
    satoshis: Int!
    invoice: String
    valueGenerated: Int!
    hashtags: [Hashtag]
  }

  type Hashtag {
    id: ID
    name: String!
    reks: RekStream!
    followedByCurrentUser: Boolean!
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
    profilePic: String!
  }

  input EpisodeInput {
    title: String!
    description: String!
    released: String!
  }

  input TagInput {
    name: String!
  }

  type Invoice {
    satoshis: Int
    invoice: String
  }

  type InvoicePaid {
    userId: Int!
    invoice: String!
  }

  type SearchResults {
    episode: EpisodeStream
    podcast: PodcastStream
    user: UserStream
    hashtag: HashtagStream
  }

  type Subscription {
    invoicePaid(invoice: String!): InvoicePaid!
  }

  type Query {
    allUsers: [User] @requireAuth
    currentUser: User! @requireAuth
    user(username: String): User! @requireAuth
    episode(id: Int!): Episode! @requireAuth
    search(term: String!, type: String!, n: Int): SearchResults @requireAuth
    reks(n: Int!, userId: String, feed: Boolean): RekStream! @requireAuth
    users(n: Int!, userId: String, followers: Boolean, following: Boolean): UserStream! @requireAuth
    bookmarks(n: Int!, userId: String): BookmarkStream! @requireAuth
    podcast(slug: String!): Podcast! @requireAuth
    hashtag(name: String): Hashtag @requireAuth
    hashtagFeed(name: String, n: Int!): RekStream! @requireAuth
  }

  type Mutation {
    parsePodcast(rssUrl: String!): Podcast! @requireAuth
    withdrawInvoice(satoshis: Int!): Invoice! @requireAuth
    toggleFollow(followeeId: String, hashtagId: String, type: String): Boolean! @requireAuth
    createRekView(rekId: Int!): RekView! @requireAuth
    createBookmark(episodeId: Int!): BookmarkResponse! @requireAuth
    destroyBookmark(episodeId: Int!): BookmarkResponse! @requireAuth
    createRek(episodeId: String!, tags: [TagInput], walletSatoshis: Int, invoiceSatoshis: Int): Invoice! @requireAuth
    createPodcast(title: String, rss: String, description: String, email: String, website: String, image: String): Podcast! @requireAuth
    createEpisodes(episodes: [EpisodeInput], podcastId: String!): [Episode] @requireAuth
    createUser(email: String!, username: String!, password: String!): LogInResponse!
    updateUser(email: String, username: String, password: String, profilePic: Upload): User! @requireAuth
    logIn(username: String!, password: String!): LogInResponse!
  }
`;

module.exports = typeDefs;
