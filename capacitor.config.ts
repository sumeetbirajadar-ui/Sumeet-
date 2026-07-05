import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sumeet.tracker',
  appName: "Sumeet's Tracker",
  webDir: 'dist',
  backgroundColor: '#FBF8F1',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
    },
  },
};

export default config;
