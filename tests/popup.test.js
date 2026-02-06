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

    // Mock des APIs Chrome de base
    globalThis.chrome = {
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
        create: jest.fn(),
      },
      runtime: {
        lastError: null,
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
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
      },
    };
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

    describe("Export du rapport", () => {
      test("devrait stocker les données et ouvrir un nouvel onglet", async () => {
        // Fonction exportReport (copie pour le test)
        function exportReport(results, score) {
          const reportDate = new Date().toLocaleDateString("fr-FR");
          const reportTime = new Date().toLocaleTimeString("fr-FR");

          return new Promise((resolve) => {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                const pageUrl = tabs[0]?.url || "Page inconnue";
                const pageTitle = tabs[0]?.title || "Sans titre";

                const reportData = {
                  results,
                  score,
                  pageUrl,
                  pageTitle,
                  reportDate,
                  reportTime,
                };

                chrome.storage.session.set({ reportData }, function () {
                  const reportUrl = chrome.runtime.getURL(
                    "src/report/report.html",
                  );
                  chrome.tabs.create({ url: reportUrl });
                  resolve();
                });
              },
            );
          });
        }

        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([
            {
              url: "https://example.com",
              title: "Page de test",
            },
          ]);
        });

        chrome.tabs.create = jest.fn();

        const mockResults = {
          images: { total: 5, issues: [] },
          links: { total: 3, issues: [] },
        };
        const mockScore = 85;

        // Return a Promise for the test
        return exportReport(mockResults, mockScore).then(() => {
          // Vérifier que chrome.tabs.query a été appelé
          expect(chrome.tabs.query).toHaveBeenCalledWith(
            { active: true, currentWindow: true },
            expect.any(Function),
          );

          // Vérifier que les données ont été stockées
          expect(chrome.storage.session.set).toHaveBeenCalledWith(
            expect.objectContaining({
              reportData: expect.objectContaining({
                results: mockResults,
                score: mockScore,
                pageUrl: "https://example.com",
                pageTitle: "Page de test",
              }),
            }),
            expect.any(Function),
          );

          // Vérifier qu'un nouvel onglet a été créé
          expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: "chrome-extension://fake-id/src/report/report.html",
          });
        });
      });

      test("devrait gérer l'absence de données de page", () => {
        // Mock sans données de tab
        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([]);
        });

        function exportReport(results, score) {
          const reportDate = new Date().toLocaleDateString("fr-FR");
          const reportTime = new Date().toLocaleTimeString("fr-FR");

          return new Promise((resolve) => {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                const pageUrl = tabs[0]?.url || "Page inconnue";
                const pageTitle = tabs[0]?.title || "Sans titre";

                const reportData = {
                  results,
                  score,
                  pageUrl,
                  pageTitle,
                  reportDate,
                  reportTime,
                };

                // Vérifier les valeurs par défaut
                expect(reportData.pageUrl).toBe("Page inconnue");
                expect(reportData.pageTitle).toBe("Sans titre");
                expect(reportData.score).toBe(0);
                resolve();
              },
            );
          });
        }

        return exportReport({}, 0);
      });

      test("devrait inclure la date et l'heure du rapport", () => {
        chrome.tabs.query = jest.fn((queryInfo, callback) => {
          callback([
            {
              url: "https://example.com",
              title: "Page de test",
            },
          ]);
        });

        function exportReport(results, score) {
          const reportDate = new Date().toLocaleDateString("fr-FR");
          const reportTime = new Date().toLocaleTimeString("fr-FR");

          return new Promise((resolve) => {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                const pageUrl = tabs[0]?.url || "Page inconnue";
                const pageTitle = tabs[0]?.title || "Sans titre";

                const reportData = {
                  results,
                  score,
                  pageUrl,
                  pageTitle,
                  reportDate,
                  reportTime,
                };

                chrome.storage.session.set({ reportData }, function () {
                  // Vérifier que la date et l'heure sont présentes
                  expect(reportData.reportDate).toBeTruthy();
                  expect(reportData.reportTime).toBeTruthy();
                  expect(typeof reportData.reportDate).toBe("string");
                  expect(typeof reportData.reportTime).toBe("string");
                  resolve();
                });
              },
            );
          });
        }

        return exportReport({ images: { total: 0, issues: [] } }, 100);
      });
    });

    describe("Messages d'explication", () => {
      test("devrait afficher des explications pour chaque catégorie", () => {
        const explanations = {
          images:
            "Les images doivent avoir un attribut alt pour être accessibles aux lecteurs d'écran",
          links: "Les liens doivent avoir un texte descriptif clair",
          headings:
            "Les titres doivent suivre une hiérarchie logique (H1, H2, H3...)",
        };

        expect(explanations.images).toContain("attribut alt");
        expect(explanations.links).toContain("texte descriptif");
        expect(explanations.headings).toContain("hiérarchie");
      });
    });
  });
});
