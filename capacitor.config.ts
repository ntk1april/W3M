import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.w3m.app',
  appName: 'W3M',
  // Point to your deployed Next.js server URL.
  // Change this to your actual production URL when you deploy.
  // For local development you can also use your machine's LAN IP, e.g. http://192.168.1.x:3000
  server: {
    url: 'https://w-3m.vercel.app',
    androidScheme: 'https',
    errorPath: 'error.html',
  },
  webDir: 'out', // only used if you ever do static export; ignored when server.url is set
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
