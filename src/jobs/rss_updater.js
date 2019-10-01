module.exports = function() {
  const DB = require('../models');
  const RssFeed = require('../datasources/rss_feed');

  const Podcast = DB.podcast;
  const Episode = DB.episode;

  const podcasts = Podcast.findAll().then(podcasts => {
    podcasts.forEach(podcast => {
      console.log(podcast.title);
      const feed = new RssFeed(podcast.rss);
      feed.subscribe(async (episodes) => {
        const latestEpisodeDate = await podcast.latestEpisodeDate;
        let episode = episodes.shift();
        while (episode.released > latestEpisodeDate) {
          Episode.create({
            podcastId: podcast.id, title: episode.title,
            description: episode.description, released: episode.released
          });
          episode = episodes.shift();
        }
      })
    })
  });
};
