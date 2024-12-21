import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  files: ['{src,config,database,types}/**/*.{ts,tsx}', 'eslint.config.mjs'],
  ignores: ['{src/admin,types/generated}/**'],
  extends: [
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    eslintConfigPrettier,
  ],
  languageOptions: {
    parserOptions: {
      project: 'tsconfig.json',
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
