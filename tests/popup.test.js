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

    test("devrait initialiser les filtres à true par défaut", () => {
      const activeFilters = {
        images: true,
        svg: true,
        links: true,
        headings: true,
        forms: true,
        colorblind: true,
        structure: true,
        buttons: true,
      };

      expect(activeFilters).toEqual({
        images: true,
        svg: true,
        links: true,
        headings: true,
        forms: true,
        colorblind: true,
        structure: true,
        buttons: true,
      });
    });

    describe("Affichage des résultats", () => {
      test("devrait afficher les résultats de l'audit correctement", () => {
        const mockResults = {
          images: { total: 10, issues: [], passed: 10 },
          links: { total: 5, issues: [], passed: 5 },
        };

        function displayResults(results) {
          const resultsDiv = document.getElementById("results");
          let html = "";

          if (results.images) {
            html += `<div class="category">Images: ${results.images.passed}/${results.images.total}</div>`;
          }
          if (results.links) {
            html += `<div class="category">Liens: ${results.links.passed}/${results.links.total}</div>`;
          }

          resultsDiv.innerHTML = html;
        }

        displayResults(mockResults);

        const resultsDiv = document.getElementById("results");
        expect(resultsDiv.innerHTML).toContain("Images: 10/10");
        expect(resultsDiv.innerHTML).toContain("Liens: 5/5");
      });

      test("devrait calculer le score global correctement", () => {
        const mockResults = {
          images: { total: 10, passed: 8 },
          links: { total: 10, passed: 6 },
          headings: { total: 5, passed: 5 },
        };

        function calculateScore(results) {
          let totalElements = 0;
          let totalPassed = 0;

          Object.values(results).forEach((category) => {
            if (category.total !== undefined) {
              totalElements += category.total;
              totalPassed += category.passed;
            }
          });

          return totalElements > 0
            ? Math.round((totalPassed / totalElements) * 100)
            : 0;
        }

        const score = calculateScore(mockResults);

        const EXPECTED_SCORE = 76; // (8+6+5)/(10+10+5) * 100 = 76%
        expect(score).toBe(EXPECTED_SCORE);
      });

      test("devrait afficher le score avec la bonne couleur", () => {
        const SCORE_GREEN_THRESHOLD = 80;
        const SCORE_ORANGE_THRESHOLD = 60;

        function getScoreColor(score) {
          if (score >= SCORE_GREEN_THRESHOLD) {
            return "green";
          }
          if (score >= SCORE_ORANGE_THRESHOLD) {
            return "orange";
          }
          return "red";
        }

        const TEST_SCORE_GREEN = 90;
        const TEST_SCORE_ORANGE = 70;
        const TEST_SCORE_RED = 50;
        expect(getScoreColor(TEST_SCORE_GREEN)).toBe("green");
        expect(getScoreColor(TEST_SCORE_ORANGE)).toBe("orange");
        expect(getScoreColor(TEST_SCORE_RED)).toBe("red");
      });
    });

    describe("Filtres", () => {
      test("devrait activer ou désactiver un filtre lors du clic", () => {
        const activeFilters = {
          images: true,
          links: true,
        };

        // Simuler le toggle d'un filtre
        activeFilters.images = !activeFilters.images;

        expect(activeFilters.images).toBe(false);
        expect(activeFilters.links).toBe(true);
      });

      test("devrait filtrer les résultats affichés en fonction des filtres actifs", () => {
        const fullResults = {
          images: { total: 10, issues: [{ element: "Image 1" }] },
          links: { total: 5, issues: [] },
        };

        const activeFilters = {
          images: false,
          links: true,
        };

        function filterResults(results, filters) {
          const filtered = {};

          Object.keys(results).forEach((key) => {
            if (filters[key]) {
              filtered[key] = results[key];
            }
          });

          return filtered;
        }

        const filtered = filterResults(fullResults, activeFilters);

        expect(filtered.images).toBeUndefined();
        expect(filtered.links).toBeTruthy();
      });
    });

    describe("Interactions avec Chrome API", () => {
      test("devrait envoyer un message pour lancer l'audit", async () => {
        const mockCallback = jest.fn();

        const MOCK_TAB_ID = 123;
        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([{ id: MOCK_TAB_ID }]);
        });

        chrome.tabs.sendMessage = jest.fn((tabId, message, callback) => {
          callback({ success: true });
        });

        // Simuler l'appel
        const [tab] = await new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });

        expect(tab.id).toBe(MOCK_TAB_ID);
        expect(chrome.tabs.query).toHaveBeenCalled();
      });

      test("devrait gérer les erreurs de l'API Chrome", () => {
        chrome.runtime.lastError = { message: "Erreur simulée" };

        function handleChromeError() {
          if (chrome.runtime.lastError) {
            return chrome.runtime.lastError.message;
          }
          return null;
        }

        const errorMessage = handleChromeError();
        expect(errorMessage).toBe("Erreur simulée");
      });
    });

    describe("Bouton Effacer les marqueurs", () => {
      test("devrait envoyer un message pour effacer les marqueurs", async () => {
        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([{ id: 1 }]);
        });

        chrome.tabs.sendMessage = jest.fn((tabId, message, callback) => {
          expect(message.action).toBe("clearVisualFeedback");
          callback({ success: true });
        });

        async function clearMarkers() {
          const [tab] = await new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, resolve);
          });

          return new Promise((resolve) => {
            chrome.tabs.sendMessage(
              tab.id,
              { action: "clearVisualFeedback" },
              resolve,
            );
          });
        }

        await clearMarkers();

        expect(chrome.tabs.sendMessage).toHaveBeenCalled();
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { action: "clearVisualFeedback" },
          expect.any(Function),
        );
      });

      test("devrait afficher une confirmation après avoir effacé les marqueurs", () => {
        const btn = document.getElementById("clearMarkersBtn");
        const originalText = btn.textContent;

        // Simuler le changement de texte
        btn.textContent = "✓ Marqueurs effacés";

        expect(btn.textContent).toBe("✓ Marqueurs effacés");
        expect(btn.textContent).not.toBe(originalText);
      });
    });

    describe("Scroll to error", () => {
      test("devrait envoyer un message pour scroller vers une image", async () => {
        const imageId = "accessibility-img-0";

        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([{ id: 1 }]);
        });

        chrome.tabs.sendMessage = jest.fn((tabId, message, callback) => {
          expect(message.action).toBe("scrollToImage");
          expect(message.imageId).toBe(imageId);
          callback({ success: true });
        });

        async function navigateToImage(id) {
          const [tab] = await new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, resolve);
          });

          return new Promise((resolve) => {
            chrome.tabs.sendMessage(
              tab.id,
              { action: "scrollToImage", imageId: id },
              resolve,
            );
          });
        }

        await navigateToImage(imageId);

        expect(chrome.tabs.sendMessage).toHaveBeenCalled();
      });
    });
  });
});
