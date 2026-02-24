/**
 * Configuration pour l'environnement de test Jest
 * S'exécute APRÈS l'initialisation de Jest
 * Contient les helpers et le cleanup automatique
 */

// Note : Les mocks Chrome API sont dans mock-extension-apis.js (setupFiles)

// Mock de window.getComputedStyle
global.window.getComputedStyle = jest.fn((element) => {
  // Créer un objet de style qui retourne les valeurs des styles inline
  const style = {
    position: "static",
    getPropertyValue: jest.fn((prop) => {
      if (element && element.style) {
        return element.style[prop] || "";
      }
      return "";
    }),
  };

  // Ajouter les propriétés CSS communes directement accessibles
  if (element && element.style) {
    const inlineStyle = element.getAttribute("style");
    if (inlineStyle) {
      // Parser les styles inline
      const styleProps = inlineStyle.split(";").reduce((acc, prop) => {
        const [key, value] = prop.split(":").map((s) => s.trim());
        if (key && value) {
          // Convertir kebab-case en camelCase (ex: background-color → backgroundColor)
          const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          acc[camelKey] = value;
        }
        return acc;
      }, {});

      // Copier toutes les propriétés parsées dans l'objet style
      Object.assign(style, styleProps);
    }
  }

  return style;
});

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
