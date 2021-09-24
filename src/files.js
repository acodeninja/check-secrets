const fg = require("fast-glob");

module.exports = {
  glob: async (patterns) => await fg(patterns, {dot: true})
};
