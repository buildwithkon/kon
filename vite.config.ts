import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  fmt: {
    useTabs: false,
    tabWidth: 2,
    printWidth: 110,
    singleQuote: true,
    jsxSingleQuote: false,
    quoteProps: 'as-needed',
    trailingComma: 'none',
    semi: false,
    arrowParens: 'always',
    bracketSameLine: false,
    bracketSpacing: true,
    singleAttributePerLine: false,
    ignorePatterns: [
      'node_modules',
      'dist',
      'build',
      '.wrangler',
      'out',
      'coverage',
      '**/*.d.ts',
      'experiments/**/dist',
      'packages/contracts/lib/**',
      'packages/contracts/out/**',
      'packages/contracts/cache/**',
      'pnpm-lock.yaml',
      'apps/pwa/app/routes/admin.config.tsx'
    ]
  },
  lint: {
    categories: {
      correctness: 'error',
      perf: 'warn',
      suspicious: 'warn',
      pedantic: 'off',
      style: 'off',
      nursery: 'off',
      restriction: 'off'
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-empty': [
        'warn',
        {
          allowEmptyCatch: true
        }
      ]
    },
    ignorePatterns: [
      'node_modules',
      'dist',
      'build',
      '.wrangler',
      'out',
      'coverage',
      '**/*.d.ts',
      'experiments',
      'packages/contracts/lib/**',
      'packages/contracts/out/**',
      'packages/contracts/cache/**',
      'apps/pwa/app/routes/admin.config.tsx',
      'packages/shared-react/hooks/useXMTP.ts',
      'packages/shared-react/hooks/useUser.ts',
      'packages/shared-react/hooks/useEnsUser.ts',
      'packages/shared-react/components/modules/Conversation.tsx',
      'packages/shared-react/components/modules/Conversation.old.tsx',
      'packages/shared-react/components/modules/Conversations.tsx',
      'packages/shared-react/components/IcalConfigDialog.tsx',
      'packages/xmtp-agent'
    ],
    options: {
      typeAware: true,
      typeCheck: true
    }
  }
})
