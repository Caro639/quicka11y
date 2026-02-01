/**
 * Tests unitaires pour popup.js
 * Teste l'interface utilisateur et les interactions avec l'extension
 */

describe("QuickA11y - Interface Popup", () => {
  beforeEach(() => {
    // Configurer le DOM de la popup avant chaque test
    document.body.innerHTML = `
      <div id="results"></div>
      <div id="scoreDisplay"></div>
      <button id="clearMarkersBtn">Effacer les marqueurs</button>
      <div class="filters">
        <input type="checkbox" id="filter-images" checked>
        <input type="checkbox" id="filter-links" checked>
      </div>
    `;
  });

  describe("Initialisation", () => {
    test("devrait charger tous les éléments DOM nécessaires", () => {
      const resultsDiv = document.getElementById("results");
      const scoreDisplay = document.getElementById("scoreDisplay");
      const clearBtn = document.getElementById("clearMarkersBtn");

      expect(resultsDiv).toBeTruthy();
      expect(scoreDisplay).toBeTruthy();
      expect(clearBtn).toBeTruthy();
    });
  });
});
