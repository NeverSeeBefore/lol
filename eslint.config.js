import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // react-hooks v7 的 recommended 含 React Compiler 规则集，存量代码暂不适用，仅保留经典两条
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'import/no-unresolved': 'off', // 别名与打包解析交给 Vite
      'import/named': 'off', // 对 ESM 包的静态分析有误报，命名导入由 TS 校验
      'import/extensions': 'off',

      'react/prop-types': 'off',

      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',

      'no-console': 'off',
      'no-useless-assignment': 'warn', // 存量 tween 动画代码有死赋值，先告警
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'jsx-quotes': ['error', 'prefer-double'],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  prettier,
);
