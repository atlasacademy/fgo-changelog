require('dotenv').config();

const Path = require('path'),
    region = process.argv[2],
    repo = process.env.REPO,
    webhook = process.env.WEBHOOK,
    path = Path.join(__dirname, '..', `fgo-game-data-${region}`);

Promise.resolve()
       .then(() => require('./initRepository')(region, repo, path))
       .then(() => require('./getModifiedFiles')(path))
       .then(({sha, files}) => require('./describeChanges')(region, path, sha, files))
       .then(output => require('./pushToWebhook.js')(webhook, output))
       .then(() => console.log('DONE'));
