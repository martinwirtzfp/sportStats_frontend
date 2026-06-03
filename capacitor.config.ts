import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'sportStats_frontend',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
