import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  files: ['{src,config,database,types,test}/**/*.{ts,tsx}', 'eslint.config.mjs', 'babel.config.js'],
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
        printWidth: 120,
      },
    ],
    '@typescript-eslint/no-unsafe-type-assertion': ['error'],
    '@typescript-eslint/explicit-function-return-type': ['error'],
    '@typescript-eslint/explicit-module-boundary-types': ['error'],
    '@typescript-eslint/strict-boolean-expressions': ['error'],
    '@typescript-eslint/no-empty-function': ['error'],
    '@typescript-eslint/explicit-member-accessibility': ['error'],
    '@typescript-eslint/member-ordering': ['error'],
    '@typescript-eslint/adjacent-overload-signatures': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: true,
        arrowParameter: true,
        memberVariableDeclaration: true,
        objectDestructuring: true,
        parameter: true,
        propertyDeclaration: true,
        variableDeclaration: true,
        variableDeclarationIgnoreFunction: true,
      },
    ],
    '@typescript-eslint/no-inferrable-types': 'off',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-console': ['error'],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'variableLike', format: ['camelCase'] },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
    ],
    'no-restricted-globals': [
      'error',
      {
        name: 'Map',
        message: 'Use SMap.',
      },
      {
        name: 'Set',
        message: 'Use SSet.',
      },
    ],
    '@typescript-eslint/no-extraneous-class': 'off',
  },
});
