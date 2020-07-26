const _ = require('lodash'),
    NodeGit = require('nodegit');

module.exports = async function (path) {
    const repo = await NodeGit.Repository.open(path),
        commit = await repo.getReferenceCommit('HEAD'),
        sha = commit.sha(),
        diffs = await commit.getDiff(),
        files = [];

    diffs.forEach(diff => {
        for (let i = 0; i < diff.numDeltas(); i++) {
            const delta = diff.getDelta(i);
            files.push(delta.newFile().path());
        }
    });

    return { sha, files };
}
