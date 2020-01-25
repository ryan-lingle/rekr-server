const rssUpdater = require('./rss_updater');
const valueGeneratedUpdater = require('./value_generated_updater');
const podcastCreator = require('./podcast_creator');


// module.exports = function() {
rssUpdater();
valueGeneratedUpdater();
podcastCreator();
// }
