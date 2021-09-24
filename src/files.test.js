const {glob} = require("./files");

describe('glob()', () => {
  test('finds all files', async () => {
    const files = await glob(["./fixtures/script/**"]);

    expect(files).toStrictEqual([
      './fixtures/script/.gitignore',
      './fixtures/script/build.sh',
    ])
  });
});
