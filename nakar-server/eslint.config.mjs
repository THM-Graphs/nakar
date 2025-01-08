import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  files: [
    '{src,config,database,types,test}/**/*.{ts,tsx}',
    'eslint.config.mjs',
    'babel.config.js',
  ],
  ignores: ['{src/admin,types/generated,dist}/**'],
  extends: [
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    tseslint.configs.strictTypeChecked,
    eslintConfigPrettier,
  ],
  languageOptions: {
    parserOptions: {
      project: ['tsconfig.json', 'test/tsconfig.json', 'tsconfig.configs.json'],
    },
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
        singleQuote: true,
      },
    ],
    '@typescript-eslint/no-unsafe-type-assertion': ['error'],
    '@typescript-eslint/explicit-function-return-type': ['error'],
    '@typescript-eslint/explicit-module-boundary-types': ['error'],
    '@typescript-eslint/strict-boolean-expressions': ['error'],
    '@typescript-eslint/no-empty-function': ['error'],
    '@typescript-eslint/explicit-member-accessibility': ['error'],
    '@typescript-eslint/member-ordering': ['error'],
    '@typescript-eslint/no-shadow': ['error'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
});
