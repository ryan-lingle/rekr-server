const { Podcast, Episode } = require('./models');
const unirest = require('unirest');

const response = unirest.post('https://listen-api.listennotes.com/api/v2/podcasts')
  .header('X-ListenAPI-Key', '0a5c5bf8b8294eafab570b23a18367e7')
  .header('Content-Type', 'application/x-www-form-urlencoded')
  .send('rsses=https://rss.art19.com/recode-decode,https://rss.art19.com/the-daily,https://www.npr.org/rss/podcast.php?id=510331,https://www.npr.org/rss/podcast.php?id=510331')
  .send('itunes_ids=1457514703,1386234384,659155419')
  .send('show_latest_episodes=1')
  .send('ids=3302bc71139541baa46ecb27dbf6071a,68faf62be97149c280ebcc25178aa731,37589a3e121e40debe4cef3d9638932a,9cf19c590ff0484d97b18b329fed0c6a')
  .then(response => response.toJSON())
  .then(result => console.log(result))
