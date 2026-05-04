// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'drizzle/**',
      'coverage/**',
      '*.config.js',
      '*.config.cjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Không báo lỗi Prettier (gồm CRLF/LF) trong ESLint — vẫn có thể chạy `npm run format` khi cần
      'prettier/prettier': 'off',
    },
  },
  // ioredis / nodemailer + bcrypt + @nestjs/jwt: một số môi trường IDE/projectService báo "type could not be resolved" → no-unsafe-* nhiễu; vẫn kiểm tra bằng tsc
  {
    files: [
      'src/redis/redis.service.ts',
      'src/mailer/mailer.service.ts',
      'src/features/auth/auth.service.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
