/**
 * Mock de l'API Chrome pour les tests Jest
 * S'exécute AVANT l'initialisation de l'environnement de test
 * Conforme aux recommandations Google pour tester les extensions Chrome
 */

global.chrome = {
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(async () => {
      throw new Error("Unimplemented. Use jest.spyOn to mock this.");
    }),
    sendMessage: jest.fn(),
    create: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(async () => {
      throw new Error("Unimplemented. Use jest.spyOn to mock this.");
    }),
  },
  storage: {
    session: {
      set: jest.fn((data, callback) => {
        if (callback) {
          callback();
        }
      }),
      get: jest.fn((keys, callback) => {
        if (callback) {
          callback({});
        }
      }),
    },
    sync: {
      set: jest.fn((data, callback) => {
        if (callback) {
          callback();
        }
      }),
      get: jest.fn((keys, callback) => {
        if (callback) {
          callback({});
        }
      }),
    },
  },
};
