const https = require('https');
const core = require('@actions/core');

function run() {
  const url = core.getInput('url');
  const matchString = core.getInput('match-string');

  core.notice(`[GET]: ${url}`);

  https
    .get(url, function (res) {
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        const result = body.match(new RegExp(matchString, 'g'));
        core.setOutput('is-match', !!result);
        core.setOutput('result', result);
      });
    })
    .on('error', function (error) {
      core.setOutput('error', error.message);
      core.setFailed(error.message);
    });
}

run();
