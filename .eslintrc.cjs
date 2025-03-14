module.exports = {
  "env": {
    "es2022": true,
    "node": true,
    "jest": true
  },
  "extends": "airbnb-base",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "import/extensions": ["error", "always"],
    "no-console": "off",
    "process-exit": "off",
    "no-underscore-dangle": ["error", { "allow": ["__filename", "__dirname"] }],
    "no-restricted-syntax": "off"
  }
};
