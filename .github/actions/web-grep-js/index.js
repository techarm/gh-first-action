const https = require('https');
const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

function run() {
  const url = core.getInput('url');
  const matchString = core.getInput('match-string');

  https
    .get(url, function (res) {
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        const result = body.match(new RegExp(matchString));
        core.setOutput('is-match', !!result);
        core.setOutput('result', result);
      });
    })
    .on('error', function (e) {
      core.setOutput('error', error.message);
      core.setFailed(error.message);
    });

  core.notice('hello from my custom Javascript Action.');
}

run();
