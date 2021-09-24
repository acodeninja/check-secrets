const core = require('@actions/core');
const { promises: fs } = require('fs')
const fastq = require('fastq');
const {glob} = require("./src/files");

const action_name = "acodeninja/check-secrets";

(async () => {
  const secrets = core.getInput('secrets')
    .split("\n")
    .map(secret => secret.split(": "));

  const patterns = core.getInput('patterns')
    .split("\n");

  const files = await glob(patterns);

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

  files.forEach(entry => queue.push(entry).catch(e => errors.push(e)));

  await queue.drained();

  if (foundSecrets.length !== 0) {
    console.log(`::error title=${action_name}::Found secrets in your build 😱`)

    foundSecrets.forEach(({name, entry}) => {
      console.log(`::warning file=${entry},title=${action_name}::Found ${name} in ${entry}`)
    });

    process.exit(1);
  } else {
    console.log("I couldn't find any secrets 🎉");
  }
})().catch(error => {
  console.error('Something went really wrong here 😰');
  core.setFailed(error.message);
})
