import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arduinostok.app',
  appName: 'Arduino Atölyesi',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
