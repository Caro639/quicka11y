/**
 * Configuration pour l'environnement de test Jest
 * S'exécute APRÈS l'initialisation de Jest
 * Contient les helpers et le cleanup automatique
 */

// Note : Les mocks Chrome API sont dans mock-extension-apis.js (setupFiles)

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

// Nettoyage automatique après chaque test
afterEach(() => {
  jest.clearAllMocks();
  global.cleanDOM();
});
