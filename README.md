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
2.  cat <<EEE > .husky/commit-msg
    #!/bin/sh
    . "\$(dirname "\$0")/\_/husky.sh"
    npx --no -- commitlint --edit "\${1}"
    EEE
3.  chmod a+x .husky/commit-msg
