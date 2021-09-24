const core = require('@actions/core');
const github = require('@actions/github');
const fg = require('fast-glob');
const { promises: fs } = require('fs')
const fastq = require('fastq');

(async () => {
  const secrets = core.getInput('secrets')
    .split("\n")
    .map(secret => secret.split(": "));

  const patterns = core.getInput('patterns')
    .split("\n");

  const entries = await fg(patterns, {dot: true});

  const foundSecrets = [];
  const errors = [];

  const queue = fastq.promise(async (entry) => {
    const file = await fs.readFile(entry, 'utf8');

    secrets.forEach(([name, value]) => {
      if (file.includes(value)) {
        foundSecrets.push({name, entry});
      }
    });
  }, 20);

  entries.forEach(entry => queue.push(entry).catch(e => errors.push(e)));

  await queue.drained();

  if (foundSecrets.length !== 0) {
    core.setFailed(`Oh no! Found some secrets 😱`);

    foundSecrets.forEach(({name, entry}) => {
      core.warning('Found secret', {
        title: name,
      });
    });

    console.error(foundSecrets.join('\n'));
  } else {
    console.log("I couldn't find any secrets 🎉");
  }
})().catch(error => {
  console.error('Something went really wrong here 😰');
  core.setFailed(error.message);
})
