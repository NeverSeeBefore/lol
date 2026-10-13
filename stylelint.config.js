/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  overrides: [
    {
      files: ['**/*.less'],
      customSyntax: 'postcss-less',
    },
  ],
  rules: {
    'order/properties-alphabetical-order': true,
    'comment-empty-line-before': null,
    'declaration-empty-line-before': null,
    'no-descending-specificity': null,
    'no-invalid-double-slash-comments': null,
    'rule-empty-line-before': 'always',
  },
  ignoreFiles: ['node_modules/**/*', 'dist/**/*'],
};
