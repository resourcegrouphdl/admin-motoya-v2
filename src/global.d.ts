export {};

declare global {
  interface Window {
    appVersion: {
      get: () => string;
    };
  }
}