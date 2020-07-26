const Axios = require('axios');

module.exports = async function(webhook, output) {
    const chunks = output.match(/.{1,1000}\n/gs);

    for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        await Axios.post(webhook, {
            username: 'FGO Changelog',
            avatar_url: 'https://apps.atlasacademy.io/db/logo192.png',
            content
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
};
