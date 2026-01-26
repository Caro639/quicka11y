// Configuration initiale pour tous les tests
// Ce fichier s'exécute avant chaque test

// Mock de l'API Chrome pour les extensions
global.chrome = {
  runtime: {
    lastError: null,
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([{ id: 1, url: "https://example.com" }]);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) callback({ success: true });
    }),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// Mock de window.getComputedStyle
global.window.getComputedStyle = jest.fn(() => ({
  position: "static",
  getPropertyValue: jest.fn(),
}));

// Fonction helper pour créer un DOM de test
global.createTestDOM = (html) => {
  document.body.innerHTML = html;
};

// Fonction helper pour nettoyer le DOM
global.cleanDOM = () => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
};

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
  cleanDOM();
});
