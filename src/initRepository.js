const File = require('fs'),
    {spawnSync} = require('child_process');

function run(args) {
    const response = spawnSync(args[0], args.slice(1));

    console.log(args.join(' '));
    console.log(response.output.join('\n'));
}

module.exports = async function (region, repo, path) {
    if (!File.existsSync(path)) {
        run(['git', 'clone', '--single-branch', '--branch', region, repo, path]);
    }

    run(['git', '-C', path, 'fetch', 'origin']);
    run(['git', '-C', path, 'reset', '--hard', `origin/${region}`]);
    run(['git', '-C', path, 'clean', '-fdx']);

    return;
};
