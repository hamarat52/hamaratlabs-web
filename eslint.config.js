import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // public/ altındaki başka repolardan kopyalanan derlenmiş/hazır sayfalar (oyunlar, okul projeleri, önizlemeler)
  // kendi repolarında bakılır; .wrangler yerel Cloudflare Pages sunucusunun geçici çıktısı.
  {
    ignores: [
      'dist',
      '.wrangler',
      'public/oyunlar/**',
      'public/okul-projeleri/**',
      'public/zburada-onizleme/**',
      'public/zburada-onizleme-v2/**',
    ],
  },
  // Node'da çalışan yapılandırma dosyası.
  { files: ['vite.config.js'], languageOptions: { globals: globals.node } },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Büyük harfli adlar (JSX bileşeni olarak kullanılan değişkenler/parametreler, ör. `as: Tag`) kullanılmış sayılır.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
