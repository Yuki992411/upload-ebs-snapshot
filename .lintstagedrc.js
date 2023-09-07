const path = require("path");

module.exports = {
  "*.{js,ts}": (absolutePaths) => {
    const cwd = process.cwd();
    const relativePaths = absolutePaths
      .map((file) => path.relative(cwd, file))
      .join(" ");
    return [`eslint --fix ${relativePaths}`];
  },
  "*.{json,js,ts}": "prettier --write",
};
