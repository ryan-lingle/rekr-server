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

  type NotificationStream {
    more: Boolean
    stream: [Notification]
    count: Int!
  }

  type User {
    id: ID!
    current: Boolean!
    satoshis: Int!
    username: String!
    email: String
    emailVerified: Boolean!
    password: String
    profilePic: String
    podcasts: [Podcast]
    reks: RekStream!
    bookmarks: BookmarkStream!
    followers: UserStream!
    following: UserStream!
    feed: RekStream!
    notifications: [Notification]
    rek_views: [RekView]
    followedHashtags: [Hashtag]
    followedByCurrentUser: Boolean!
    paymentMethod: String
    walletPermission: Boolean!
    canTweet: Boolean!
  }

  type Episode {
    id: ID
    podcast: Podcast
    title: String
    description: String
    bookmarked: Boolean
    released: Date
    donationSum: Int
    guests: [User]
  }

  type Podcast {
    id: ID
    title: String
    rss: String
    description: String
    email: String
    emailVerified: Boolean!
    website: String
    image: String
    itunesId: Int
    slug: String
    episodes: [Episode]
    latestEpisodeDate: Date
    donationSum: Int
    donationCount: Int
    guestShare: Float!
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
    monthValueGenerated: Int!
    hashtags: [Hashtag]
  }

  type EmailVerification {
    user: User
    podcast: Podcast
  }

  type Hashtag {
    id: ID
    name: String!
    reks: RekStream!
    followers: Int!
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

  type Notification {
    id: ID
    user: User!
    notifier: User!
    rek: Rek!
    type: String!
    satoshis: Int
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
    email: String
    hasPodcast: Boolean!
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

  type WithdrawResponse {
    satoshis: Int!
    success: Boolean!
    error: String
  }

  type TwitterResponse {
    id: Int!
    signIn: Boolean!
    token: String
    username: String
    profilePic: String
    email: String
    hasPodcast: Boolean
  }

  type EpisodeShow {
    rek: Rek
    episode: Episode!
  }

  type Subscription {
    invoicePaid(invoice: String!): InvoicePaid!
  }

  type Query {
    currentUser: User! @requireAuth
    user(username: String!): User!
    episode(id: Int!): Episode!
    episodeShow(episodeId: String!, rekId: String): EpisodeShow!
    search(term: String!, type: String!, n: Int): SearchResults
    reks(n: Int!, userId: String, feed: Boolean): RekStream!
    users(n: Int!, userId: String, followers: Boolean, following: Boolean): UserStream!
    bookmarks(n: Int!, userId: String): BookmarkStream!
    podcast(slug: String, id: String): Podcast!
    hashtag(name: String): Hashtag
    hashtagFeed(name: String, n: Int!): RekStream!
    notifications(n: Int!): NotificationStream! @requireAuth
  }

  type Mutation {
    parsePodcast(rssUrl: String!): Podcast! @requireAuth
    deposit(satoshis: Int!): Invoice! @requireAuth
    withdraw(invoice: String!): WithdrawResponse! @requireAuth
    toggleFollow(followeeId: String, hashtagId: String, type: String): Boolean! @requireAuth
    createRekView(rekId: Int!): RekView! @requireAuth
    createBookmark(episodeId: String!, rekId: String): BookmarkResponse! @requireAuth
    destroyBookmark(episodeId: String!, rekId: String): BookmarkResponse! @requireAuth
    createRek(episodeId: String!, tweetRek: Boolean!, tags: [TagInput], walletSatoshis: Int, invoiceSatoshis: Int): Invoice! @requireAuth
    createPodcast(title: String, rss: String, description: String, email: String, website: String, image: String): Podcast! @requireAuth
    createEpisodes(episodes: [EpisodeInput], podcastId: String!): [Episode] @requireAuth
    createUser(email: String!, username: String!, password: String!, rekId: String): LogInResponse!
    updateUser(email: String, username: String, password: String, profilePic: Upload): User! @requireAuth
    logIn(username: String!, password: String!): LogInResponse!
    confirmEmail(token: String!): EmailVerification!
    resendUserEmail: Boolean!
    resendPodcastEmail(podcastId: String!): Boolean!
    twitterToken: String!
    twitterAccessToken(requestToken: String!, oathVerifier: String!): TwitterResponse!
    guestShare(percentage: Float!, podcastId: String!): Boolean! @requireAuth
    tagGuest(userIds: [String!], episodeIds: [String!], podcastId: String!): Boolean! @requireAuth
  }
`;

module.exports = typeDefs;
