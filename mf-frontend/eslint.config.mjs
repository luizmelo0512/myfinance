import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import configPrettier from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Desativa regras do ESLint que conflitam com o Prettier
  configPrettier,
  {
    plugins: {
      'unused-imports': unusedImports,
      prettier: prettier,
    },
    rules: {
      // Força a formatação do Prettier como uma regra de erro
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          endOfLine: 'auto',
        },
      ],

      // REMOVE imports não utilizados automaticamente no save
      'unused-imports/no-unused-imports': 'error',

      // Avisa sobre variáveis não utilizadas (exceto as que começam com _)
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),
]);

export default eslintConfig;
