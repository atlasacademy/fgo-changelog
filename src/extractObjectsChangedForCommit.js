const File = require('fs'),
    NodeGit = require('nodegit'),
    Path = require('path');

function getObjectsByLines(path, startLine, endLine) {
    const contents = File.readFileSync(path).toString(),
        chunks = contents.replace('[{\n', '')
                         .replace('\n}]', '')
                         .split('}, {\n'),
        objects = [];

    if (endLine === null) {
        endLine = contents.split('\n').length;
    }

    let currentLine = 1;
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i],
            lines = chunk.split('\n').length,
            currentEnd = currentLine + lines;

        if (currentEnd > startLine) {
            objects.push(JSON.parse(`{${chunk}}`));
        }

        if (currentEnd >= endLine) {
            break;
        }

        currentLine = currentEnd;
    }

    return objects;
}

module.exports = async function (path, sha, file) {
    const repo = await NodeGit.Repository.open(path),
        blame = await NodeGit.Blame.file(repo, file),
        files = [];

    let startLine = null;
    for (let i = 0; i < blame.getHunkCount(); i++) {
        const blameHunk = blame.getHunkByIndex(i);

        if (startLine !== null) {
            files.push(...getObjectsByLines(
                Path.join(path, file),
                startLine - 2, // these line numbers include git diff headers
                blameHunk.finalStartLineNumber() - 2 // these line numbers include git diff headers
            ));

            startLine = null;
        }

        if (blameHunk.finalCommitId().tostrS() === sha) {
            startLine = blameHunk.finalStartLineNumber();
        }
    }

    if (startLine !== null) {
        files.push(...getObjectsByLines(
            Path.join(path, file),
            startLine - 2, // these line numbers include git diff headers
            null
        ));
    }

    return files;
};
