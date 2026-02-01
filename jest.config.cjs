module.exports = {
  // Environnement de test : jsdom simule un navigateur
  testEnvironment: "jsdom",

  // Extensions de fichiers à traiter
  moduleFileExtensions: ["js", "json"],

  // Motif de recherche des tests
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],

  // Fichiers à ignorer
  testPathIgnorePatterns: ["/node_modules/"],

  // Configuration de la couverture de code
  collectCoverageFrom: [
    "src/**/*.js",
    "!node_modules/**",
    "!coverage/**",
    "!jest.config.js",
    "!jest.setup.js",
  ],

  // Seuils de couverture désactivés pour extensions Chrome
  // (les fichiers ne peuvent pas être importés directement)
  // Les tests valident la logique via simulation
  coverageThreshold: undefined,

  // Format des rapports de couverture
  coverageReporters: ["text", "lcov", "html"],

  // Setup avant les tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
