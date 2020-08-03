const Axios = require('axios');

module.exports = async function (webhook, output) {
    const fieldLimit = 1000,
        embedPayloadLimit = 6000,
        embeds = [],
        embedPayloadCount = 5;

    let embed = {
        title: output.title,
        fields: []
    };
    embeds.push(embed);

    output.fields.forEach(field => {
        let embedField = {
            name: field.name,
            value: ""
        };

        field.values.forEach(value => {
            if (JSON.stringify(embed).length + JSON.stringify(embedField).length + value.length + 2 > fieldLimit) {
                if (embedField.value !== "") {
                    embed.fields.push(embedField);
                }

                embed = {
                    title: `Part ${embeds.length + 1}`,
                    fields: []
                };
                embeds.push(embed);

                embedField = {
                    name: field.name,
                    value: ""
                };
            }

            embedField.value += `${embedField.value === '' ? '' : ', '}${value}`;
        });

        embed.fields.push(embedField);
    });

    for (let i = 0; i < embeds.length; i += embedPayloadCount) {
        try {
            await Axios.post(webhook, {
            username: 'FGO Changelog',
            avatar_url: 'https://apps.atlasacademy.io/db/logo192.png',
            embeds: embeds.slice(i, i + embedPayloadCount)
        });
        } catch (e) {
            console.log(e.response);
            throw e;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
};
