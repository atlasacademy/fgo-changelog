const File = require('fs'),
    Path = require('path'),
    {spawnSync} = require('child_process');

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

function getModifiedRanges(path, sha, file) {
    const regex = new RegExp(`^${sha} ([0-9]+) ([0-9]+)`),
        blameLines = spawnSync('git', ['-C', path, 'blame', '-lp', file])
            .output
            .join('\n')
            .split('\n')
            .map(line => {
                return line.match(regex);
            })
            .filter(match => match)
            .map(match => parseInt(match[1]))
            .sort(((a, b) => a - b)),
        ranges = [];

    if (!blameLines.length)
        return [];

    let currentLine = blameLines[0],
        startLine = blameLines[0];

    blameLines.slice(1).forEach(line => {
        if (currentLine + 1 === line) {
            currentLine = line;

            return;
        }

        ranges.push([startLine, currentLine]);
        currentLine = startLine = line;
    });

    ranges.push([startLine, currentLine]);

    return ranges;
}

module.exports = async function (path, sha, file) {
    const ranges = getModifiedRanges(path, sha, file),
        objs = [];

    ranges.forEach(([start, end]) => {
        objs.push(...getObjectsByLines(Path.join(path, file), start, end));
    });

    return objs;
};
