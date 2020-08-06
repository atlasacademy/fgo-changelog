const File = require('fs'),
    Path = require('path'),
    ChildProcess = require('child_process');

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

function getModifiedLines(path, sha, file) {
    const regex = new RegExp(`^${sha} ([0-9]+) ([0-9]+)`),
        blame = ChildProcess.spawn('git', ['-C', path, 'blame', '-lp', file]),
        lines = [];

    blame.stdout.on('data', data => {
        const dataLines = data.toString().split('\n');

        dataLines.forEach(line => {
            if (line.match(regex)) {
                lines.push(line.match(regex)[1]);
            }
        });
    });

    return new Promise(resolve => {
        blame.on('close', (code, signal) => {
            resolve(lines);
        });
    })
}

async function getModifiedRanges(path, sha, file) {
    const blameLines = await getModifiedLines(path, sha, file),
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
    const ranges = await getModifiedRanges(path, sha, file),
        objs = [];

    ranges.forEach(([start, end]) => {
        objs.push(...getObjectsByLines(Path.join(path, file), start, end));
    });

    return objs;
};
