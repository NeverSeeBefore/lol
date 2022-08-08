# lol-b

## 安装钩子

- pre-commit
npx husky install
npm run prepare
npx husky add .husky/pre-commit "npx lint-staged"
<!-- git add .husky/pre-commit -->

- commit-msg
  https://github.com/conventional-changelog/commitlint

1.  npx husky install
2.

```js
cat <<EEE > .husky/commit-msg
#!/bin/sh
. "\$(dirname "\$0")/_/husky.sh"

npx --no -- commitlint --edit "\${1}"
EEE
```

3.  chmod a+x .husky/commit-msg

## help

- eslintrc debug
  npx eslint --debug /Users/chenxiaoxu/Desktop/personal/lol/.eslintrc.js

## package

eslint-plugin-prettier：Runs Prettier as an ESLint rule and reports differences as individual ESLint issues.
eslint-config-prettier：Turns off all rules that are unnecessary or might conflict with [Prettier].(extends: [..., prettier])
