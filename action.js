const core = require('@actions/core');
const github = require('@actions/github');
const fg = require('fast-glob');
const { promises: fs } = require('fs')
const chalk = require('chalk');
const fastq = require('fastq');

class FoundSecret extends Error {
}

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
    console.log(chalk.blue(`Searching ${entry} for secrets`));

    const file = await fs.readFile(entry, 'utf8');

    secrets.forEach(([name, value]) => {
      if (file.includes(value)) {
        foundSecrets.push(`Found ${name} in ${entry}`);
      }
    });
  }, 20);

  entries.forEach(
    entry => queue.push(entry)
      .then()
      .catch(e => errors.push(e))
  );

  await queue.drained();

  if (foundSecrets.length !== 0) {
    core.setFailed(`Found some secrets!`);
    console.error(foundSecrets.join('\n'));
  }
})().then(() => {
  console.log(chalk.green('No secrets were found!'))
}).catch(error => {
  console.log(chalk.redBright('Something went really wrong here!'))
  core.setFailed(error.message);
})
