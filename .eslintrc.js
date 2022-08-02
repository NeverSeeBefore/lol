const OFF = 0;
const WARN = 1;
const ERROR = 2;

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    // 社区预设
    'airbnb',
    'plugin:react/recommended',
    // React Hooks 检查
    'airbnb/hooks',
    // ts 检查
    'plugin:@typescript-eslint/recommended',
    // 提供更多的配置项
    'plugin:unicorn/recommended',
    'plugin:promise/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'unicorn', 'promise'],
  rules: {
    'import/extensions': [
      ERROR,
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        json: 'never',
        js: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
      },
    },
  },
};
