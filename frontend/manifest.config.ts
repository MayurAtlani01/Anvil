import { defineManifest } from '@crxjs/vite-plugin';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Anvil — Learning Assistant',
  version: '0.1.0',
  description: 'AI-powered learning assistant inside your browser for Reading, Interview Prep, and Exam Revision.',
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'icons/16.png',
      '32': 'icons/32.png',
      '48': 'icons/48.png',
      '128': 'icons/128.png',
    },
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.tsx'],
      run_at: 'document_start',
    },
  ],
  permissions: ['storage', 'activeTab', 'scripting', 'sidePanel', 'contextMenus', 'tabs'],
  host_permissions: ['http://*/*', 'https://*/*'],
  icons: {
    '16': 'icons/16.png',
    '32': 'icons/32.png',
    '48': 'icons/48.png',
    '128': 'icons/128.png',
  },
});

export default manifest;

