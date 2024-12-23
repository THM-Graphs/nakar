import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  files: [
    '{src,config,database,types,test}/**/*.{ts,tsx}',
    'eslint.config.mjs',
    'babel.config.js',
  ],
  ignores: ['{src/admin,types/generated}/**'],
  extends: [
    eslint.configs.recommended,
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
  },
});
