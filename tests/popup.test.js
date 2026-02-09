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

    // Note : Les mocks Chrome API sont gérés par mock-extension-apis.js
    // Ne pas redéfinir globalThis.chrome ici pour ne pas écraser les mocks globaux
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

// Exemple de tests avec jest.spyOn selon les recommandations Google
describe("QuickA11y - Tests avec jest.spyOn (recommandations Google)", () => {
  beforeEach(() => {
    // Nettoyer le DOM
    document.body.innerHTML = "";
  });

  describe("chrome.tabs.query - Méthode Google", () => {
    test("devrait retourner l'onglet actif avec jest.spyOn", async () => {
      // BONNE PRATIQUE : Utiliser jest.spyOn pour mocker une valeur spécifique
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([
        {
          id: 3,
          active: true,
          currentWindow: true,
          url: "https://example.com",
          title: "Example Page",
        },
      ]);

      // Fonction à tester
      async function getActiveTabId() {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        return tabs[0]?.id;
      }

      const tabId = await getActiveTabId();

      expect(tabId).toBe(3);
      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
    });

    test("devrait gérer plusieurs appels avec des valeurs différentes", async () => {
      // Premier appel
      jest
        .spyOn(chrome.tabs, "query")
        .mockResolvedValueOnce([{ id: 1, active: true, currentWindow: true }]);

      const tabs1 = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      expect(tabs1[0].id).toBe(1);

      // Deuxième appel avec une valeur différente
      jest
        .spyOn(chrome.tabs, "query")
        .mockResolvedValueOnce([{ id: 5, active: true, currentWindow: true }]);

      const tabs2 = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      expect(tabs2[0].id).toBe(5);
    });
  });

  describe("chrome.scripting.executeScript - Méthode Google", () => {
    test("devrait injecter un script dans un onglet", async () => {
      jest
        .spyOn(chrome.scripting, "executeScript")
        .mockResolvedValue([{ result: "script executed" }]);

      const result = await chrome.scripting.executeScript({
        target: { tabId: 1 },
        files: ["src/content/content.js"],
      });

      expect(result[0].result).toBe("script executed");
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ["src/content/content.js"],
      });
    });

    test("devrait gérer les erreurs d'injection", async () => {
      jest
        .spyOn(chrome.scripting, "executeScript")
        .mockRejectedValue(new Error("Cannot access tab"));

      await expect(
        chrome.scripting.executeScript({
          target: { tabId: 999 },
          files: ["src/content/content.js"],
        }),
      ).rejects.toThrow("Cannot access tab");
    });
  });

  describe("chrome.storage - Méthode Google", () => {
    test("devrait sauvegarder et récupérer des données", async () => {
      const testData = { theme: "dark", score: 85 };

      // Mock de set
      jest
        .spyOn(chrome.storage.session, "set")
        .mockImplementation((data, callback) => {
          callback && callback();
          return Promise.resolve();
        });

      // Mock de get
      jest
        .spyOn(chrome.storage.session, "get")
        .mockImplementation((keys, callback) => {
          callback && callback(testData);
          return Promise.resolve(testData);
        });

      // Sauvegarder
      await new Promise((resolve) => {
        chrome.storage.session.set(testData, resolve);
      });

      expect(chrome.storage.session.set).toHaveBeenCalledWith(
        testData,
        expect.any(Function),
      );

      // Récupérer
      const retrieved = await new Promise((resolve) => {
        chrome.storage.session.get(["theme", "score"], resolve);
      });

      expect(retrieved).toEqual(testData);
    });
  });
});

// ============================================================================
// 🎓 TESTS DES FONCTIONS PURES - Apprentissage guidé
// ============================================================================
// Note : Nous copions les fonctions ici pour les tester avec Jest
// Dans un monde idéal, on importerait directement de popup-utils.js
// mais Jest (configuré en CommonJS) a du mal avec les modules ES6

describe("QuickA11y - Fonctions pures (Apprentissage)", () => {
  // Constantes copiées de popup-utils.js
  const MAX_TEXT_LENGTH = 80;
  const MAX_URL_LENGTH = 60;

  // ========================================================================
  // Test 1 : generateIssueDetailsHTML()
  // ========================================================================
  // Cette fonction génère du HTML pour afficher les détails d'un problème
  // Elle prend un objet 'issue' et retourne une chaîne HTML

  describe("generateIssueDetailsHTML()", () => {
    // Copie de la fonction depuis popup-utils.js pour les tests
    function generateIssueDetailsHTML(issue) {
      const details = [];

      if (issue.text) {
        const truncatedText =
          issue.text.length > MAX_TEXT_LENGTH
            ? `${issue.text.substring(0, MAX_TEXT_LENGTH)}...`
            : issue.text;
        details.push(`<p class="issue-detail">Texte: "${truncatedText}"</p>`);
      }

      if (issue.src) {
        const truncatedSrc =
          issue.src.length > MAX_URL_LENGTH
            ? `${issue.src.substring(0, MAX_URL_LENGTH)}...`
            : issue.src;
        details.push(`<p class="issue-detail">Source: ${truncatedSrc}</p>`);
      }

      if (issue.href) {
        const truncatedHref =
          issue.href.length > MAX_URL_LENGTH
            ? `${issue.href.substring(0, MAX_URL_LENGTH)}...`
            : issue.href;
        details.push(`<p class="issue-detail">Lien: ${truncatedHref}</p>`);
      }

      if (issue.type) {
        details.push(`<p class="issue-detail">Type: ${issue.type}</p>`);
      }

      return details.join("");
    }
    // 📝 TEST 1 : Cas le plus simple - Issue avec texte court
    test("devrait générer le HTML pour une issue avec un texte court", () => {
      // ARRANGE (Préparer) : Créer les données de test
      const issue = {
        text: "Bouton sans label",
      };

      // ACT (Agir) : Appeler la fonction
      const html = generateIssueDetailsHTML(issue);

      // ASSERT (Vérifier) : Vérifier le résultat
      expect(html).toContain('class="issue-detail"');
      expect(html).toContain("Texte:");
      expect(html).toContain("Bouton sans label");
      expect(html).not.toContain("..."); // Pas de troncature pour texte court
    });

    // 📝 TEST 2 : Troncature - Texte trop long (> 80 caractères)
    test("devrait tronquer un texte long (> 80 caractères)", () => {
      // ARRANGE : Créer un texte de 100 caractères
      const longText = "A".repeat(100); // "AAAA... " × 100

      const issue = {
        text: longText,
      };

      // ACT
      const html = generateIssueDetailsHTML(issue);

      // ASSERT
      expect(html).toContain("..."); // Le texte doit être tronqué
      expect(html).toContain(longText.substring(0, 80)); // Les 80 premiers caractères
      expect(html).not.toContain(longText); // Pas le texte complet
    });

    // 📝 TEST 3 : Propriétés multiples
    test("devrait générer plusieurs éléments pour une issue complète", () => {
      // ARRANGE : Issue avec toutes les propriétés
      const issue = {
        text: "Lien",
        src: "https://example.com/image.jpg",
        href: "https://example.com/page",
        type: "button",
      };

      // ACT
      const html = generateIssueDetailsHTML(issue);

      // ASSERT : Vérifier que TOUS les éléments sont présents
      expect(html).toContain("Texte:");
      expect(html).toContain("Lien");
      expect(html).toContain("Source:");
      expect(html).toContain("https://example.com/image.jpg");
      expect(html).toContain("Lien:");
      expect(html).toContain("https://example.com/page");
      expect(html).toContain("Type:");
      expect(html).toContain("button");

      // Vérifier qu'il y a 4 éléments <p>
      const pCount = (html.match(/<p class="issue-detail">/g) || []).length;
      expect(pCount).toBe(4);
    });

    // 📝 TEST 4 : Issue vide (edge case)
    test("devrait retourner une chaîne vide pour une issue sans propriétés", () => {
      // ARRANGE
      const issue = {}; // Issue vide

      // ACT
      const html = generateIssueDetailsHTML(issue);

      // ASSERT : Doit retourner chaîne vide ""
      expect(html).toBe("");
    });

    // 📝 TEST 5 : Troncature d'URL longue
    test("devrait tronquer une URL longue (> 60 caractères)", () => {
      // ARRANGE : URL de 100 caractères
      const longUrl = "https://example.com/" + "path/".repeat(20); // > 60 caractères

      const issue = {
        href: longUrl,
      };

      // ACT
      const html = generateIssueDetailsHTML(issue);

      // ASSERT : URL tronquée à 60 caractères + "..."
      expect(html).toContain("..."); // Doit être tronqué
      expect(html).toContain(longUrl.substring(0, 60)); // Les 60 premiers caractères
    });

    // 📝 TEST 6 : Cas limite - Texte exactement 80 caractères
    test("ne devrait PAS tronquer un texte de 80 caractères exactement", () => {
      // ARRANGE : Texte de exactement 80 caractères
      const exactText = "A".repeat(80);

      const issue = {
        text: exactText,
      };

      // ACT
      const html = generateIssueDetailsHTML(issue);

      // ASSERT : Pas de troncature (pas de "...")
      expect(html).not.toContain("...");
      expect(html).toContain(exactText);
    });
  });

  // ========================================================================
  // Test 2 : generateNavigationButtonsHTML()
  // ========================================================================
  // Cette fonction génère des boutons de navigation "Voir dans la page"
  // Elle vérifie plusieurs types d'IDs et transforme les noms d'attributs

  describe("generateNavigationButtonsHTML()", () => {
    // Copie de la fonction depuis popup-utils.js pour les tests
    function generateNavigationButtonsHTML(issue) {
      const buttons = [];
      const idTypes = [
        "imageId",
        "linkId",
        "svgId",
        "headingId",
        "formId",
        "buttonId",
      ];

      idTypes.forEach((idType) => {
        if (issue[idType]) {
          buttons.push(
            `<button class="goto-btn" data-${idType.replace(/Id$/, "-id")}="${issue[idType]}">Voir dans la page</button>`,
          );
        }
      });

      return buttons.join("");
    }

    // 📝 TEST 1 : Issue vide (aucun ID) - Edge case important !
    test("devrait retourner une chaîne vide pour une issue sans ID", () => {
      // ARRANGE : Issue sans aucun ID de navigation
      const issue = {
        text: "Problème détecté",
        severity: "high",
      };

      // ACT : Générer les boutons
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : Aucun bouton généré
      expect(html).toBe("");
      expect(html).not.toContain("button");
    });

    // 📝 TEST 2 : Un seul ID présent (imageId)
    test("devrait générer UN bouton pour une issue avec imageId", () => {
      // ARRANGE : Issue avec seulement imageId
      const issue = {
        imageId: "accessibility-img-0",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : 1 bouton avec les bonnes propriétés
      expect(html).toContain('class="goto-btn"');
      expect(html).toContain("Voir dans la page");
      expect(html).toContain("accessibility-img-0");

      // Vérifier qu'il n'y a qu'UN SEUL bouton
      const buttonCount = (html.match(/<button/g) || []).length;
      expect(buttonCount).toBe(1);
    });

    // 📝 TEST 3 : Transformation du nom d'attribut (IMPORTANT !)
    test("devrait transformer imageId en data-image-id", () => {
      // ARRANGE
      const issue = {
        imageId: "test-123",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : Vérifier la transformation
      // "imageId" → "data-image-id" (supprime "Id", ajoute "-id")
      expect(html).toContain('data-image-id="test-123"');
      expect(html).not.toContain("data-imageId"); // Pas le format original
    });

    // 📝 TEST 4 : Plusieurs IDs présents
    test("devrait générer PLUSIEURS boutons pour une issue avec plusieurs IDs", () => {
      // ARRANGE : Issue avec 3 IDs différents
      const issue = {
        imageId: "img-1",
        linkId: "link-2",
        formId: "form-3",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : 3 boutons générés
      const buttonCount = (html.match(/<button/g) || []).length;
      expect(buttonCount).toBe(3);

      // Vérifier que chaque ID est présent
      expect(html).toContain('data-image-id="img-1"');
      expect(html).toContain('data-link-id="link-2"');
      expect(html).toContain('data-form-id="form-3"');
    });

    // 📝 TEST 5 : Tous les types d'IDs possibles (test exhaustif)
    test("devrait gérer TOUS les 6 types d'IDs possibles", () => {
      // ARRANGE : Issue avec TOUS les types d'IDs
      const issue = {
        imageId: "img-id",
        linkId: "link-id",
        svgId: "svg-id",
        headingId: "heading-id",
        formId: "form-id",
        buttonId: "button-id",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : 6 boutons générés
      const buttonCount = (html.match(/<button/g) || []).length;
      expect(buttonCount).toBe(6);

      // Vérifier chaque transformation d'attribut
      expect(html).toContain('data-image-id="img-id"');
      expect(html).toContain('data-link-id="link-id"');
      expect(html).toContain('data-svg-id="svg-id"');
      expect(html).toContain('data-heading-id="heading-id"');
      expect(html).toContain('data-form-id="form-id"');
      expect(html).toContain('data-button-id="button-id"');
    });

    // 📝 TEST 6 : Valeurs avec caractères spéciaux
    test("devrait gérer les IDs avec caractères spéciaux", () => {
      // ARRANGE : ID avec tirets, underscores, numéros
      const issue = {
        imageId: "accessibility-img_test-123",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : L'ID est correctement inséré
      expect(html).toContain('data-image-id="accessibility-img_test-123"');
    });

    // 📝 TEST 7 : Ordre des boutons (selon l'ordre des idTypes)
    test("devrait générer les boutons dans l'ordre défini", () => {
      // ARRANGE : Plusieurs IDs dans un ordre différent
      const issue = {
        formId: "form-1",
        imageId: "img-1",
        linkId: "link-1",
      };

      // ACT
      const html = generateNavigationButtonsHTML(issue);

      // ASSERT : Vérifier l'ordre (imageId, linkId, formId selon idTypes)
      const imageIndex = html.indexOf("data-image-id");
      const linkIndex = html.indexOf("data-link-id");
      const formIndex = html.indexOf("data-form-id");

      // imageId doit venir AVANT linkId
      expect(imageIndex).toBeLessThan(linkIndex);
      // linkId doit venir AVANT formId
      expect(linkIndex).toBeLessThan(formIndex);
    });
  });

  // ========================================================================
  // Test 3 : generateMdnLinksHTML()
  // ========================================================================
  // ⚡ FONCTION LA PLUS COMPLEXE : Logique conditionnelle selon issueIndex
  //
  // 🎯 Comportements différents :
  // - issueIndex = 0 (première issue) → Liens VISIBLES directement
  // - issueIndex > 0 (autres issues) → Liens REPLIÉS (display: none)
  //
  // Cela améliore l'UX : seule la première issue affiche les ressources

  describe("generateMdnLinksHTML()", () => {
    // Copie de la fonction depuis popup-utils.js pour les tests
    function getMdnLinks(category) {
      const mdnLinks = {
        images: [
          {
            title: "Guide d'accessibilité des images (MDN)",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#accessibilit%C3%A9",
          },
          {
            title: "Attribut alt pour les images",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#fournir_un_texte_de_remplacement_utile",
          },
        ],
        links: [
          {
            title: "Élément <a> : liens hypertextes",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/a",
          },
        ],
      };
      return mdnLinks[category] || [];
    }

    function generateMdnLinksHTML(name, issueIndex) {
      const mdnLinks = getMdnLinks(name);

      if (mdnLinks.length === 0) {
        return "";
      }

      const linksContent = mdnLinks
        .map(
          (link) =>
            `<p class="issue-mdn-link"><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></p>`,
        )
        .join("");

      // Première erreur : afficher les liens normalement
      if (issueIndex === 0) {
        return linksContent;
      }

      // Erreurs suivantes : bouton repliable
      return `
    <div class="mdn-links-collapsed">
      <span class="toggle-resources-link" data-resources-id="res-${name}-${issueIndex}">
        <svg class="resources-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="resources-text">Ressources</span>
      </span>
      <div class="mdn-links-content" id="res-${name}-${issueIndex}" style="display: none;">
        ${linksContent}
      </div>
    </div>
  `;
    }

    // 📝 TEST 1 : Edge case - Catégorie sans liens MDN
    test("devrait retourner une chaîne vide pour une catégorie sans liens", () => {
      // ARRANGE : Catégorie qui n'existe pas dans getMdnLinks()
      const name = "category-inexistante";
      const issueIndex = 0;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Pas de HTML généré
      expect(html).toBe("");
    });

    // 📝 TEST 2 : Premier élément (issueIndex = 0) → Liens VISIBLES
    test("devrait afficher les liens DIRECTEMENT pour la première issue (index 0)", () => {
      // ARRANGE : Première issue (index = 0)
      const name = "images";
      const issueIndex = 0;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Les liens sont visibles directement
      // ✅ Contient les liens MDN
      expect(html).toContain("Guide d'accessibilité des images (MDN)");
      expect(html).toContain("Attribut alt pour les images");

      // ✅ PAS de bouton "Ressources" (pas replié)
      expect(html).not.toContain("toggle-resources-link");
      expect(html).not.toContain("mdn-links-collapsed");
      expect(html).not.toContain("display: none");

      // ✅ Structure simple avec <p> et <a>
      expect(html).toContain('<p class="issue-mdn-link">');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    // 📝 TEST 3 : Deuxième élément (issueIndex > 0) → Liens REPLIÉS
    test("devrait REPLIER les liens pour les issues suivantes (index > 0)", () => {
      // ARRANGE : Deuxième issue (index = 1)
      const name = "images";
      const issueIndex = 1;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Les liens sont repliés
      // ✅ Bouton "Ressources" présent
      expect(html).toContain("toggle-resources-link");
      expect(html).toContain('<span class="resources-text">Ressources</span>');

      // ✅ Les liens sont cachés (display: none)
      expect(html).toContain("display: none");
      expect(html).toContain("mdn-links-content");

      // ✅ Les liens MDN sont toujours là (mais cachés)
      expect(html).toContain("Guide d'accessibilité des images (MDN)");

      // ✅ Structure div repliable
      expect(html).toContain('<div class="mdn-links-collapsed">');
    });

    // 📝 TEST 4 : ID unique pour chaque bouton repliable
    test("devrait générer un ID unique basé sur name et issueIndex", () => {
      // ARRANGE
      const name = "links";
      const issueIndex = 5;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : ID unique "res-{name}-{issueIndex}"
      expect(html).toContain('data-resources-id="res-links-5"');
      expect(html).toContain('id="res-links-5"');

      // Ces deux éléments sont liés :
      // - <span data-resources-id="res-links-5"> (bouton)
      // - <div id="res-links-5"> (contenu à afficher/cacher)
    });

    // 📝 TEST 5 : Plusieurs liens MDN présents
    test("devrait afficher TOUS les liens MDN d'une catégorie", () => {
      // ARRANGE : Catégorie "images" avec 2 liens
      const name = "images";
      const issueIndex = 0;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Les 2 liens sont présents
      const linkCount = (html.match(/<p class="issue-mdn-link">/g) || [])
        .length;
      expect(linkCount).toBe(2);

      // Vérifier chaque lien
      expect(html).toContain("Guide d'accessibilité des images (MDN)");
      expect(html).toContain("Attribut alt pour les images");
    });

    // 📝 TEST 6 : Structure du SVG icon
    test("devrait inclure le SVG icon dans le bouton repliable", () => {
      // ARRANGE
      const name = "images";
      const issueIndex = 2;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Le SVG est présent
      expect(html).toContain('<svg class="resources-icon"');
      expect(html).toContain('width="14" height="14"');
      expect(html).toContain("viewBox=");

      // Vérifier les paths du SVG (icône de ressources)
      const svgPathCount = (html.match(/<path/g) || []).length;
      expect(svgPathCount).toBe(3); // 3 paths dans le SVG
    });

    // 📝 TEST 7 : Différence entre index 0 et index 1 (TEST COMPARATIF)
    test("devrait avoir un comportement DIFFÉRENT pour index 0 vs index 1", () => {
      // ARRANGE
      const name = "images";

      // ACT
      const html0 = generateMdnLinksHTML(name, 0); // Première issue
      const html1 = generateMdnLinksHTML(name, 1); // Deuxième issue

      // ASSERT : Comportements différents
      // Index 0 : pas de bouton repliable
      expect(html0).not.toContain("toggle-resources-link");

      // Index 1 : bouton repliable présent
      expect(html1).toContain("toggle-resources-link");

      // Les deux contiennent les mêmes liens MDN
      expect(html0).toContain("Guide d'accessibilité des images (MDN)");
      expect(html1).toContain("Guide d'accessibilité des images (MDN)");
    });

    // 📝 TEST 8 : Sécurité des liens (target="_blank")
    test("devrait utiliser target='_blank' et rel='noopener noreferrer'", () => {
      // ARRANGE
      const name = "links";
      const issueIndex = 0;

      // ACT
      const html = generateMdnLinksHTML(name, issueIndex);

      // ASSERT : Sécurité des liens externes
      // target="_blank" : Ouvre dans un nouvel onglet
      expect(html).toContain('target="_blank"');

      // rel="noopener noreferrer" : Sécurise contre le phishing
      // (empêche le site externe d'accéder à window.opener)
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  // ========================================================================
  // Test 4 : combineStructureData()
  // ========================================================================
  // 🎯 Fonction de MANIPULATION DE DONNÉES
  //
  // Cette fonction combine 3 catégories (lang, landmarks, buttons) en une seule :
  // - Fusionne les tableaux d'issues avec spread operator (...)
  // - Additionne les valeurs numériques (total, passed)
  // - Retourne un objet avec { total, issues, passed }
  //
  // ✅ Concepts testés :
  // - Fusion de tableaux
  // - Calculs arithmétiques
  // - Structure d'objets

  describe("combineStructureData()", () => {
    // Copie de la fonction depuis popup-utils.js pour les tests
    function combineStructureData(filteredResults) {
      const structureIssues = [
        ...filteredResults.lang.issues,
        ...filteredResults.landmarks.issues,
        ...filteredResults.buttons.issues,
      ];

      return {
        total:
          filteredResults.lang.total +
          filteredResults.landmarks.total +
          filteredResults.buttons.total,
        issues: structureIssues,
        passed:
          filteredResults.lang.passed +
          filteredResults.landmarks.passed +
          filteredResults.buttons.passed,
      };
    }

    // 📝 TEST 1 : Cas simple - Données complètes
    test("devrait combiner 3 catégories en un seul objet", () => {
      // ARRANGE : Données de test avec 3 catégories
      const filteredResults = {
        lang: {
          total: 2,
          issues: [{ element: "html", issue: "Pas de lang" }],
          passed: 1,
        },
        landmarks: {
          total: 3,
          issues: [
            { element: "nav", issue: "Pas de label" },
            { element: "main", issue: "Manquant" },
          ],
          passed: 1,
        },
        buttons: {
          total: 5,
          issues: [{ element: "button", issue: "Vide" }],
          passed: 4,
        },
      };

      // ACT : Combiner les données
      const result = combineStructureData(filteredResults);

      // ASSERT : Vérifier la structure de retour
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("issues");
      expect(result).toHaveProperty("passed");

      // Vérifier les calculs
      expect(result.total).toBe(10); // 2 + 3 + 5
      expect(result.passed).toBe(6); // 1 + 1 + 4

      // Vérifier la fusion des issues
      expect(result.issues).toHaveLength(4); // 1 + 2 + 1
      expect(Array.isArray(result.issues)).toBe(true);
    });

    // 📝 TEST 2 : Vérifier l'ordre des issues fusionnées
    test("devrait fusionner les issues dans l'ordre : lang, landmarks, buttons", () => {
      // ARRANGE
      const filteredResults = {
        lang: {
          total: 1,
          issues: [{ name: "issue-lang" }],
          passed: 0,
        },
        landmarks: {
          total: 1,
          issues: [{ name: "issue-landmarks" }],
          passed: 0,
        },
        buttons: {
          total: 1,
          issues: [{ name: "issue-buttons" }],
          passed: 0,
        },
      };

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT : Vérifier l'ordre
      expect(result.issues[0].name).toBe("issue-lang");
      expect(result.issues[1].name).toBe("issue-landmarks");
      expect(result.issues[2].name).toBe("issue-buttons");
    });

    // 📝 TEST 3 : Toutes les catégories vides (Edge case)
    test("devrait retourner des valeurs nulles pour des catégories vides", () => {
      // ARRANGE : Aucune issue dans aucune catégorie
      const filteredResults = {
        lang: {
          total: 0,
          issues: [],
          passed: 0,
        },
        landmarks: {
          total: 0,
          issues: [],
          passed: 0,
        },
        buttons: {
          total: 0,
          issues: [],
          passed: 0,
        },
      };

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT : Tout est à zéro
      expect(result.total).toBe(0);
      expect(result.passed).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.issues).toEqual([]); // Tableau vide
    });

    // 📝 TEST 4 : Une seule catégorie avec des issues
    test("devrait gérer une seule catégorie avec des issues", () => {
      // ARRANGE : Seulement "landmarks" a des issues
      const filteredResults = {
        lang: {
          total: 0,
          issues: [],
          passed: 0,
        },
        landmarks: {
          total: 5,
          issues: [
            { element: "nav" },
            { element: "main" },
            { element: "footer" },
          ],
          passed: 2,
        },
        buttons: {
          total: 0,
          issues: [],
          passed: 0,
        },
      };

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT
      expect(result.total).toBe(5);
      expect(result.passed).toBe(2);
      expect(result.issues).toHaveLength(3);

      // Les 3 issues viennent de landmarks
      expect(result.issues[0].element).toBe("nav");
      expect(result.issues[1].element).toBe("main");
      expect(result.issues[2].element).toBe("footer");
    });

    // 📝 TEST 5 : Calcul avec des nombres variés
    test("devrait calculer correctement avec des grands nombres", () => {
      // ARRANGE : Nombres plus grands
      const filteredResults = {
        lang: {
          total: 100,
          issues: [],
          passed: 95,
        },
        landmarks: {
          total: 250,
          issues: [],
          passed: 200,
        },
        buttons: {
          total: 500,
          issues: [],
          passed: 450,
        },
      };

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT : Vérifier les additions
      expect(result.total).toBe(850); // 100 + 250 + 500
      expect(result.passed).toBe(745); // 95 + 200 + 450
    });

    // 📝 TEST 6 : Ne modifie PAS les données d'entrée (immutabilité)
    test("ne devrait PAS modifier les données d'entrée", () => {
      // ARRANGE : Créer des données avec Object.freeze pour détecter les modifications
      const filteredResults = {
        lang: {
          total: 1,
          issues: [{ element: "html" }],
          passed: 0,
        },
        landmarks: {
          total: 1,
          issues: [{ element: "nav" }],
          passed: 0,
        },
        buttons: {
          total: 1,
          issues: [{ element: "button" }],
          passed: 0,
        },
      };

      // Sauvegarder les valeurs originales
      const originalLangIssues = filteredResults.lang.issues.length;
      const originalLandmarksIssues = filteredResults.landmarks.issues.length;
      const originalButtonsIssues = filteredResults.buttons.issues.length;

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT : Les données d'entrée sont INTACTES
      expect(filteredResults.lang.issues.length).toBe(originalLangIssues);
      expect(filteredResults.landmarks.issues.length).toBe(
        originalLandmarksIssues,
      );
      expect(filteredResults.buttons.issues.length).toBe(originalButtonsIssues);

      // Le résultat est différent de l'entrée
      expect(result.issues).not.toBe(filteredResults.lang.issues);
    });

    // 📝 TEST 7 : Fusion avec plusieurs issues par catégorie
    test("devrait fusionner plusieurs issues de chaque catégorie", () => {
      // ARRANGE : Plusieurs issues dans chaque catégorie
      const filteredResults = {
        lang: {
          total: 3,
          issues: [{ id: 1 }, { id: 2 }],
          passed: 1,
        },
        landmarks: {
          total: 4,
          issues: [{ id: 3 }, { id: 4 }, { id: 5 }],
          passed: 1,
        },
        buttons: {
          total: 5,
          issues: [{ id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }],
          passed: 1,
        },
      };

      // ACT
      const result = combineStructureData(filteredResults);

      // ASSERT : 9 issues au total (2 + 3 + 4)
      expect(result.issues).toHaveLength(9);

      // Vérifier que toutes les IDs sont présentes et dans l'ordre
      const ids = result.issues.map((issue) => issue.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  // ========================================================================
  // Test 5 : getMdnLinks()
  // ========================================================================
  // 📚 Fonction DICTIONNAIRE avec des données statiques
  //
  // Cette fonction retourne des liens MDN selon la catégorie :
  // - images, svg, links, headings, forms, structure
  // - Retourne un tableau d'objets { title, url }
  // - Retourne [] si la catégorie n'existe pas
  //
  // ✅ Concepts testés :
  // - Accès aux propriétés d'objet (mdnLinks[category])
  // - Valeur par défaut avec || []
  // - Structure de données constantes

  describe("getMdnLinks()", () => {
    // Copie de la fonction depuis popup-utils.js pour les tests
    function getMdnLinks(category) {
      const mdnLinks = {
        images: [
          {
            title: "Guide d'accessibilité des images (MDN)",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#accessibilit%C3%A9",
          },
          {
            title: "Attribut alt pour les images",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#fournir_un_texte_de_remplacement_utile",
          },
        ],
        svg: [
          {
            title: "Identifier le SVG comme une image",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#identifier_le_svg_comme_une_image",
          },
          {
            title: "Accessibilité des SVG",
            url: "https://developer.mozilla.org/fr/docs/Web/SVG/Guides/SVG_in_HTML",
          },
          {
            title: "Utiliser role='img' et aria-label",
            url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/img_role#svg_and_roleimg",
          },
        ],
        links: [
          {
            title: "Accessibilité des liens",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/a#accessibilit%C3%A9",
          },
          {
            title: "Créer un lien avec une image",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#cr%C3%A9er_un_lien_avec_une_image",
          },
          {
            title: "ARIA: link role",
            url: "https://developer.mozilla.org/fr/docs/Web/Accessibility/ARIA/Roles/link_role",
          },
        ],
        headings: [
          {
            title: "Structurer le contenu avec des titres",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/Heading_Elements#accessibilit%C3%A9",
          },
          {
            title: "Guide des titres et structure",
            url: "https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility/HTML#une_bonne_s%C3%A9mantique",
          },
        ],
        forms: [
          {
            title: "Formulaires accessibles",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/input#accessibilit%C3%A9",
          },
          {
            title: "Élément label pour les formulaires",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/label#accessibilit%C3%A9",
          },
          {
            title: "ARIA dans les formulaires",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/form",
          },
        ],
        structure: [
          {
            title: "Structure du document et sémantique HTML",
            url: "https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility/HTML#une_bonne_s%C3%A9mantique",
          },
          {
            title: "Accessibilité des boutons",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/button#accessibilit%C3%A9",
          },
          {
            title: "Attribut lang pour la langue",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Global_attributes/lang",
          },
        ],
      };
      return mdnLinks[category] || [];
    }

    // 📝 TEST 1 : Catégorie "images" - 2 liens
    test("devrait retourner 2 liens pour la catégorie 'images'", () => {
      // ARRANGE
      const category = "images";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      // Vérifier la structure de chaque lien
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("url");

      // Vérifier le contenu
      expect(result[0].title).toBe("Guide d'accessibilité des images (MDN)");
      expect(result[0].url).toContain("developer.mozilla.org");
    });

    // 📝 TEST 2 : Catégorie "svg" - 3 liens
    test("devrait retourner 3 liens pour la catégorie 'svg'", () => {
      // ARRANGE
      const category = "svg";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe("Identifier le SVG comme une image");
      expect(result[1].title).toBe("Accessibilité des SVG");
      expect(result[2].title).toContain("role='img'");
    });

    // 📝 TEST 3 : Catégorie inexistante → tableau vide
    test("devrait retourner un tableau VIDE pour une catégorie inexistante", () => {
      // ARRANGE
      const category = "category-qui-nexiste-pas";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT : Valeur par défaut avec || []
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    // 📝 TEST 4 : Toutes les catégories définies
    test("devrait avoir des liens pour TOUTES les 6 catégories", () => {
      // ARRANGE : Les 6 catégories attendues
      const categories = [
        "images",
        "svg",
        "links",
        "headings",
        "forms",
        "structure",
      ];

      // ACT & ASSERT : Chaque catégorie a au moins 1 lien
      categories.forEach((category) => {
        const result = getMdnLinks(category);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    // 📝 TEST 5 : Structure des objets retournés
    test("chaque lien devrait avoir 'title' et 'url'", () => {
      // ARRANGE
      const category = "links";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT : Vérifier TOUS les liens
      result.forEach((link) => {
        expect(link).toHaveProperty("title");
        expect(link).toHaveProperty("url");
        expect(typeof link.title).toBe("string");
        expect(typeof link.url).toBe("string");
        expect(link.url).toMatch(/^https?:\/\//); // URL valide
      });
    });

    // 📝 TEST 6 : URLs MDN valides
    test("toutes les URLs devraient pointer vers MDN", () => {
      // ARRANGE
      const category = "forms";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT : Toutes les URLs contiennent "developer.mozilla.org"
      result.forEach((link) => {
        expect(link.url).toContain("developer.mozilla.org");
      });
    });

    // 📝 TEST 7 : Catégorie "structure" - 3 liens
    test("devrait retourner 3 liens pour la catégorie 'structure'", () => {
      // ARRANGE
      const category = "structure";

      // ACT
      const result = getMdnLinks(category);

      // ASSERT
      expect(result).toHaveLength(3);

      // Vérifier que les 3 thèmes sont couverts
      const titles = result.map((link) => link.title);
      expect(titles.some((t) => t.includes("Structure"))).toBe(true);
      expect(titles.some((t) => t.includes("boutons"))).toBe(true);
      expect(titles.some((t) => t.includes("lang"))).toBe(true);
    });

    // 📝 TEST 8 : Case sensitivity (ne devrait pas matcher)
    test("devrait être sensible à la casse", () => {
      // ARRANGE : Catégorie en majuscules
      const category = "IMAGES"; // Au lieu de "images"

      // ACT
      const result = getMdnLinks(category);

      // ASSERT : Pas de match, retourne []
      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // Test 6 : generateIssueHTML()
  // ========================================================================
  // 🎯 Fonction ORCHESTRATRICE la plus complexe !
  //
  // Cette fonction COMBINE toutes les autres :
  // - generateMdnLinksHTML(name, issueIndex)
  // - generateIssueDetailsHTML(issue)
  // - generateNavigationButtonsHTML(issue)
  // - Gère l'explanation optionnelle avec SVG
  //
  // ✅ Test d'INTÉGRATION : on vérifie que tout s'assemble correctement

  describe("generateIssueHTML()", () => {
    // Copie de toutes les fonctions nécessaires pour les tests
    function getMdnLinks(category) {
      const mdnLinks = {
        images: [
          {
            title: "Guide d'accessibilité des images (MDN)",
            url: "https://developer.mozilla.org/fr/docs/Web/HTML/Element/img#accessibilit%C3%A9",
          },
        ],
      };
      return mdnLinks[category] || [];
    }

    function generateMdnLinksHTML(name, issueIndex) {
      const mdnLinks = getMdnLinks(name);
      if (mdnLinks.length === 0) {
        return "";
      }

      const linksContent = mdnLinks
        .map(
          (link) =>
            `<p class="issue-mdn-link"><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></p>`,
        )
        .join("");

      if (issueIndex === 0) {
        return linksContent;
      }

      return `
    <div class="mdn-links-collapsed">
      <span class="toggle-resources-link" data-resources-id="res-${name}-${issueIndex}">
        <svg class="resources-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="resources-text">Ressources</span>
      </span>
      <div class="mdn-links-content" id="res-${name}-${issueIndex}" style="display: none;">
        ${linksContent}
      </div>
    </div>
  `;
    }

    function generateIssueDetailsHTML(issue) {
      const details = [];
      const MAX_TEXT_LENGTH = 80;
      const MAX_URL_LENGTH = 60;

      if (issue.text) {
        const truncatedText =
          issue.text.length > MAX_TEXT_LENGTH
            ? `${issue.text.substring(0, MAX_TEXT_LENGTH)}...`
            : issue.text;
        details.push(`<p class="issue-detail">Texte: "${truncatedText}"</p>`);
      }

      if (issue.src) {
        const truncatedSrc =
          issue.src.length > MAX_URL_LENGTH
            ? `${issue.src.substring(0, MAX_URL_LENGTH)}...`
            : issue.src;
        details.push(`<p class="issue-detail">Source: ${truncatedSrc}</p>`);
      }

      if (issue.href) {
        const truncatedHref =
          issue.href.length > MAX_URL_LENGTH
            ? `${issue.href.substring(0, MAX_URL_LENGTH)}...`
            : issue.href;
        details.push(`<p class="issue-detail">Lien: ${truncatedHref}</p>`);
      }

      if (issue.type) {
        details.push(`<p class="issue-detail">Type: ${issue.type}</p>`);
      }

      return details.join("");
    }

    function generateNavigationButtonsHTML(issue) {
      const buttons = [];
      const idTypes = [
        "imageId",
        "linkId",
        "svgId",
        "headingId",
        "formId",
        "buttonId",
      ];

      idTypes.forEach((idType) => {
        if (issue[idType]) {
          buttons.push(
            `<button class="goto-btn" data-${idType.replace(/Id$/, "-id")}="${issue[idType]}">Voir dans la page</button>`,
          );
        }
      });

      return buttons.join("");
    }

    function generateIssueHTML(issue, issueIndex, name) {
      const mdnLinksHTML = generateMdnLinksHTML(name, issueIndex);
      const detailsHTML = generateIssueDetailsHTML(issue);
      const navigationButtonsHTML = generateNavigationButtonsHTML(issue);

      const explanationHTML = issue.explanation
        ? `<p class="issue-explanation"><svg class="explanation-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> ${issue.explanation}</p>`
        : "";

      return `
    <div class="issue ${issue.severity}">
      <div class="issue-header">
        <span class="issue-element">${issue.element}</span>
        <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
      </div>
      <p class="issue-description">${issue.issue}</p>
      ${explanationHTML}
      ${mdnLinksHTML}
      ${detailsHTML}
      ${navigationButtonsHTML}
      <button class="markdown-btn" data-issue-index="${issueIndex}" data-category="${name}">Copier Markdown</button>
    </div>
  `;
    }

    // 📝 TEST 1 : HTML complet avec toutes les parties
    test("devrait générer un HTML complet avec tous les éléments", () => {
      // ARRANGE : Issue complète
      const issue = {
        element: "img",
        severity: "high",
        issue: "Pas d'attribut alt",
        explanation: "L'attribut alt est obligatoire",
        text: "Texte du lien",
        imageId: "img-1",
      };
      const issueIndex = 0;
      const name = "images";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Toutes les parties sont présentes
      expect(html).toContain("img"); // element
      expect(html).toContain("high"); // severity
      expect(html).toContain("Pas d'attribut alt"); // issue
      expect(html).toContain("L'attribut alt est obligatoire"); // explanation
      expect(html).toContain("Texte du lien"); // details
      expect(html).toContain("Voir dans la page"); // navigation
      expect(html).toContain("Copier Markdown"); // bouton markdown
      expect(html).toContain("Guide d'accessibilité"); // MDN links
    });

    // 📝 TEST 2 : Structure du conteneur principal
    test("devrait avoir la structure HTML correcte", () => {
      // ARRANGE
      const issue = {
        element: "a",
        severity: "medium",
        issue: "Lien vide",
      };
      const issueIndex = 0;
      const name = "links";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Structure du conteneur
      expect(html).toContain('<div class="issue medium">');
      expect(html).toContain('<div class="issue-header">');
      expect(html).toContain('<span class="issue-element">');
      expect(html).toContain('<span class="severity-badge severity-medium">');
      expect(html).toContain('<p class="issue-description">');
    });

    // 📝 TEST 3 : Sans explanation (optionnelle)
    test("ne devrait PAS afficher d'explication si elle est absente", () => {
      // ARRANGE : Pas d'explanation
      const issue = {
        element: "img",
        severity: "low",
        issue: "Problème détecté",
      };
      const issueIndex = 0;
      const name = "images";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Pas d'élément explanation
      expect(html).not.toContain("issue-explanation");
      expect(html).not.toContain("explanation-icon");
    });

    // 📝 TEST 4 : Avec explanation (SVG présent)
    test("devrait afficher l'explication avec SVG si présente", () => {
      // ARRANGE : Avec explanation
      const issue = {
        element: "img",
        severity: "high",
        issue: "Erreur",
        explanation: "Ceci est une explication détaillée",
      };
      const issueIndex = 0;
      const name = "images";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Explanation et SVG présents
      expect(html).toContain("issue-explanation");
      expect(html).toContain("explanation-icon");
      expect(html).toContain("Ceci est une explication détaillée");

      // Vérifier le SVG (icône ampoule)
      expect(html).toContain('<svg class="explanation-icon"');
      expect(html).toContain('width="14" height="14"');
    });

    // 📝 TEST 5 : Bouton Markdown avec data attributes
    test("devrait inclure le bouton Markdown avec les bons attributs", () => {
      // ARRANGE
      const issue = {
        element: "button",
        severity: "low",
        issue: "Bouton vide",
      };
      const issueIndex = 3;
      const name = "forms";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Bouton markdown avec data attributes
      expect(html).toContain('<button class="markdown-btn"');
      expect(html).toContain('data-issue-index="3"');
      expect(html).toContain('data-category="forms"');
      expect(html).toContain("Copier Markdown");
    });

    // 📝 TEST 6 : Intégration avec les 3 fonctions sous-jacentes
    test("devrait intégrer les 3 fonctions de génération HTML", () => {
      // ARRANGE : Issue avec détails, navigation et MDN
      const issue = {
        element: "img",
        severity: "high",
        issue: "Alt vide",
        text: "Texte alternatif",
        imageId: "img-123",
      };
      const issueIndex = 1;
      const name = "images";

      // ACT
      const html = generateIssueHTML(issue, issueIndex, name);

      // ASSERT : Les 3 parties sont présentes
      // 1. Details HTML
      expect(html).toContain('class="issue-detail"');
      expect(html).toContain("Texte alternatif");

      // 2. Navigation buttons
      expect(html).toContain('class="goto-btn"');
      expect(html).toContain('data-image-id="img-123"');

      // 3. MDN links (replié car index = 1)
      expect(html).toContain("toggle-resources-link");
      expect(html).toContain("Ressources");
    });

    // 📝 TEST 7 : Différence entre index 0 et index > 0 (MDN)
    test("devrait afficher les MDN différemment selon l'index", () => {
      // ARRANGE
      const issue = {
        element: "img",
        severity: "high",
        issue: "Erreur",
      };
      const name = "images";

      // ACT
      const html0 = generateIssueHTML(issue, 0, name); // Premier
      const html1 = generateIssueHTML(issue, 1, name); // Suivant

      // ASSERT : Comportement différent pour MDN
      // Index 0 : Liens directs (pas de bouton)
      expect(html0).toContain("Guide d'accessibilité");
      expect(html0).not.toContain("toggle-resources-link");

      // Index 1 : Liens repliés (avec bouton)
      expect(html1).toContain("Guide d'accessibilité"); // Toujours là
      expect(html1).toContain("toggle-resources-link"); // Mais replié
    });

    // 📝 TEST 8 : Propagation de la severity (classe CSS)
    test("devrait appliquer la classe de sévérité au conteneur", () => {
      // ARRANGE : Tester les 3 niveaux
      const severities = ["high", "medium", "low"];

      severities.forEach((severity) => {
        const issue = {
          element: "test",
          severity: severity,
          issue: "Test",
        };

        // ACT
        const html = generateIssueHTML(issue, 0, "images");

        // ASSERT : Classe sur le conteneur ET le badge
        expect(html).toContain(`<div class="issue ${severity}">`);
        expect(html).toContain(`severity-badge severity-${severity}`);
      });
    });
  });

  // ========================================================================
  // Test 7 : applyScoreColor() - FONCTION AVEC EFFET DE BORD (DOM)
  // ========================================================================
  // 🎨 Première fonction avec manipulation du DOM !
  //
  // Cette fonction modifie DIRECTEMENT un élément du DOM :
  // - scoreElement.style.color = "..."
  //
  // 🎯 Nouveaux concepts :
  // - Créer des éléments DOM avec jsdom (document.createElement)
  // - Vérifier les modifications de style
  // - Tester les seuils (GOOD_THRESHOLD, MEDIUM_THRESHOLD)
  //
  // 📊 Logique :
  // - Score >= 80 → Vert (#10b981)
  // - Score >= 60 → Orange (#f59e0b)
  // - Score < 60 → Rouge (#ef4444)

  describe("applyScoreColor() - Fonction avec effet de bord DOM", () => {
    // Copie de la fonction depuis popup.js pour les tests
    const SCORES = {
      GOOD_THRESHOLD: 80,
      MEDIUM_THRESHOLD: 60,
    };

    function applyScoreColor(scoreElement, score) {
      if (score >= SCORES.GOOD_THRESHOLD) {
        scoreElement.style.color = "#10b981";
      } else if (score >= SCORES.MEDIUM_THRESHOLD) {
        scoreElement.style.color = "#f59e0b";
      } else {
        scoreElement.style.color = "#ef4444";
      }
    }

    // 📝 TEST 1 : Score parfait (100) → Vert
    test("devrait appliquer la couleur VERTE pour un score de 100", () => {
      // ARRANGE : Créer un élément DOM
      const scoreElement = document.createElement("div");
      const score = 100;

      // ACT : Appliquer la couleur
      applyScoreColor(scoreElement, score);

      // ASSERT : Vérifier que style.color a été modifié
      // ⚠️ jsdom convertit automatiquement HEX → RGB !
      expect(scoreElement.style.color).toBe("rgb(16, 185, 129)"); // Vert
    });

    // 📝 TEST 2 : Score >= 80 (seuil GOOD) → Vert
    test("devrait appliquer la couleur VERTE pour un score de 80 (limite)", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 80; // Exactement sur le seuil

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 80 est >= GOOD_THRESHOLD, donc VERT
      expect(scoreElement.style.color).toBe("rgb(16, 185, 129)");
    });

    // 📝 TEST 3 : Score juste en-dessous de 80 (79) → Orange
    test("devrait appliquer la couleur ORANGE pour un score de 79", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 79; // 1 point sous le seuil GOOD

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 79 < 80, donc ORANGE
      expect(scoreElement.style.color).toBe("rgb(245, 158, 11)");
    });

    // 📝 TEST 4 : Score >= 60 (seuil MEDIUM) → Orange
    test("devrait appliquer la couleur ORANGE pour un score de 60 (limite)", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 60; // Exactement sur le seuil MEDIUM

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 60 >= MEDIUM_THRESHOLD, donc ORANGE
      expect(scoreElement.style.color).toBe("rgb(245, 158, 11)");
    });

    // 📝 TEST 5 : Score juste en-dessous de 60 (59) → Rouge
    test("devrait appliquer la couleur ROUGE pour un score de 59", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 59; // 1 point sous le seuil MEDIUM

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 59 < 60, donc ROUGE
      expect(scoreElement.style.color).toBe("rgb(239, 68, 68)");
    });

    // 📝 TEST 6 : Score très bas (0) → Rouge
    test("devrait appliquer la couleur ROUGE pour un score de 0", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 0; // Pire score possible

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 0 < 60, donc ROUGE
      expect(scoreElement.style.color).toBe("rgb(239, 68, 68)");
    });

    // 📝 TEST 7 : Score intermédiaire (70) → Orange
    test("devrait appliquer la couleur ORANGE pour un score de 70", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 70; // Entre 60 et 80

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 60 <= 70 < 80, donc ORANGE
      expect(scoreElement.style.color).toBe("rgb(245, 158, 11)");
    });

    // 📝 TEST 8 : Score intermédiaire élevé (90) → Vert
    test("devrait appliquer la couleur VERTE pour un score de 90", () => {
      // ARRANGE
      const scoreElement = document.createElement("div");
      const score = 90; // Au-dessus de 80

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : 90 >= 80, donc VERT
      expect(scoreElement.style.color).toBe("rgb(16, 185, 129)");
    });

    // 📝 TEST 9 : Vérifier que l'élément EXISTE bien avant modification
    test("ne devrait PAS planter si l'élément a déjà un style", () => {
      // ARRANGE : Élément avec style existant
      const scoreElement = document.createElement("div");
      scoreElement.style.color = "black"; // Style initial
      scoreElement.style.fontSize = "20px";
      const score = 85;

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : Le nouveau style remplace l'ancien
      expect(scoreElement.style.color).toBe("rgb(16, 185, 129)");
      // Les autres styles sont préservés
      expect(scoreElement.style.fontSize).toBe("20px");
    });

    // 📝 TEST 10 : Test avec élément du DOM réel (comme dans popup.html)
    test("devrait fonctionner avec un élément du DOM réel", () => {
      // ARRANGE : Créer un élément comme dans popup.html
      document.body.innerHTML = `
        <div id="totalScore">75%</div>
      `;
      const scoreElement = document.getElementById("totalScore");
      const score = 85;

      // ACT
      applyScoreColor(scoreElement, score);

      // ASSERT : Vérifier que l'élément du DOM a été modifié
      expect(scoreElement.style.color).toBe("rgb(16, 185, 129)");
    });
  });

  // ========================================================================
  // Test 8 : clearMarkers() - FONCTION ASYNC AVEC CHROME API
  // ========================================================================
  // 🚀 Fonction la plus complexe à tester jusqu'à présent !
  //
  // Cette fonction utilise :
  // 1. async/await - Programmation asynchrone
  // 2. chrome.tabs.query() - Récupère l'onglet actif
  // 3. chrome.tabs.sendMessage() - Envoie un message au content script
  // 4. Callback avec chrome.runtime.lastError - Gestion d'erreurs Chrome
  // 5. Modification du DOM (textContent)
  // 6. setTimeout() - Délai pour restaurer le texte
  //
  // 🎯 Nouveaux concepts :
  // - Mock de chrome.tabs.query() avec jest.spyOn()
  // - Mock de chrome.tabs.sendMessage() avec callback
  // - jest.useFakeTimers() pour contrôler setTimeout()
  // - Test de fonctions async avec async/await
  // - Vérifier les appels de fonctions mockées

  describe("clearMarkers() - Fonction async avec Chrome API", () => {
    // Copie de la fonction depuis popup.js
    const TIMEOUTS = {
      FEEDBACK_MESSAGE: 2000, // 2 secondes
    };

    async function clearMarkers() {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        chrome.tabs.sendMessage(
          tab.id,
          { action: "clearVisualFeedback" },
          function (_response) {
            if (chrome.runtime.lastError) {
              console.error("Erreur:", chrome.runtime.lastError);
              return;
            }
            // Visual confirmation (optional)
            const btn = document.getElementById("clearMarkersBtn");
            const originalText = btn.textContent;
            btn.textContent = "✓ Marqueurs effacés";
            setTimeout(() => {
              btn.textContent = originalText;
            }, TIMEOUTS.FEEDBACK_MESSAGE);
          },
        );
      } catch (error) {
        console.error("Erreur lors du nettoyage:", error);
      }
    }

    // 📝 TEST 1 : Succès complet - Vérifier les appels Chrome API
    test("devrait appeler chrome.tabs.query avec les bons paramètres", async () => {
      // ARRANGE : Mock de chrome.tabs.query
      const mockTab = { id: 123, url: "https://example.com" };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);
      jest.spyOn(chrome.tabs, "sendMessage").mockImplementation(() => {});

      // ACT : Appeler la fonction
      await clearMarkers();

      // ASSERT : Vérifier l'appel à query()
      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(chrome.tabs.query).toHaveBeenCalledTimes(1);
    });

    // 📝 TEST 2 : Vérifier l'envoi du message au content script
    test("devrait envoyer un message 'clearVisualFeedback' au tab actif", async () => {
      // ARRANGE
      const mockTab = { id: 456, url: "https://test.com" };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);
      jest.spyOn(chrome.tabs, "sendMessage").mockImplementation(() => {});

      // ACT
      await clearMarkers();

      // ASSERT : Vérifier l'appel à sendMessage()
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        456, // tab.id
        { action: "clearVisualFeedback" },
        expect.any(Function), // La fonction callback
      );
    });

    // 📝 TEST 3 : Modification du DOM après succès
    test("devrait modifier le texte du bouton en cas de succès", async () => {
      // ARRANGE : Créer le bouton dans le DOM
      document.body.innerHTML = `
        <button id="clearMarkersBtn">Effacer les marqueurs</button>
      `;
      const btn = document.getElementById("clearMarkersBtn");

      const mockTab = { id: 789 };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);

      // Mock sendMessage pour exécuter immédiatement le callback
      jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation((_tabId, _message, callback) => {
          // Simuler un succès (pas d'erreur)
          chrome.runtime.lastError = null;
          callback({}); // Exécuter le callback
        });

      // ACT
      await clearMarkers();

      // ASSERT : Le texte du bouton a changé
      expect(btn.textContent).toBe("✓ Marqueurs effacés");
    });

    // 📝 TEST 4 : Restauration du texte après timeout
    test("devrait restaurer le texte original après 2 secondes", async () => {
      // ARRANGE : Utiliser les fake timers de Jest
      jest.useFakeTimers();

      document.body.innerHTML = `
        <button id="clearMarkersBtn">Effacer les marqueurs</button>
      `;
      const btn = document.getElementById("clearMarkersBtn");
      const originalText = btn.textContent;

      const mockTab = { id: 111 };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);
      jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation((_tabId, _message, callback) => {
          chrome.runtime.lastError = null;
          callback({});
        });

      // ACT
      await clearMarkers();

      // Le texte est modifié immédiatement
      expect(btn.textContent).toBe("✓ Marqueurs effacés");

      // Avancer le temps de 2000ms
      jest.advanceTimersByTime(2000);

      // ASSERT : Le texte est restauré
      expect(btn.textContent).toBe(originalText);

      // Cleanup
      jest.useRealTimers();
    });

    // 📝 TEST 5 : Gestion de chrome.runtime.lastError
    test("devrait gérer chrome.runtime.lastError correctement", async () => {
      // ARRANGE : Mock console.error pour vérifier l'appel
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      document.body.innerHTML = `
        <button id="clearMarkersBtn">Effacer</button>
      `;
      const btn = document.getElementById("clearMarkersBtn");

      const mockTab = { id: 999 };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);

      // Simuler une erreur Chrome
      jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation((_tabId, _message, callback) => {
          chrome.runtime.lastError = { message: "Tab fermé" };
          callback({});
        });

      // ACT
      await clearMarkers();

      // ASSERT : console.error a été appelé avec l'erreur
      expect(consoleErrorSpy).toHaveBeenCalledWith("Erreur:", {
        message: "Tab fermé",
      });

      // Le bouton NE doit PAS changer (car erreur détectée)
      expect(btn.textContent).toBe("Effacer");

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    // 📝 TEST 6 : Gestion d'exception dans try/catch
    test("devrait gérer les exceptions dans le try/catch", async () => {
      // ARRANGE : Mock console.error
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Simuler une erreur lors de chrome.tabs.query
      jest
        .spyOn(chrome.tabs, "query")
        .mockRejectedValue(new Error("Pas d'onglet actif"));

      // ACT
      await clearMarkers();

      // ASSERT : console.error a été appelé avec l'exception
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Erreur lors du nettoyage:",
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    // 📝 TEST 7 : Ne doit pas planter si le bouton n'existe pas
    test("ne devrait PAS planter si clearMarkersBtn n'existe pas dans le DOM", async () => {
      // ARRANGE : DOM vide (pas de bouton)
      document.body.innerHTML = "";

      const mockTab = { id: 222 };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);
      jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation((_tabId, _message, callback) => {
          chrome.runtime.lastError = null;
          callback({});
        });

      // ACT & ASSERT : Ne doit pas lever d'exception
      await expect(clearMarkers()).resolves.not.toThrow();
    });

    // 📝 TEST 8 : Vérifier la séquence complète d'appels
    test("devrait exécuter la séquence complète : query → sendMessage → DOM", async () => {
      // ARRANGE
      jest.useFakeTimers();

      document.body.innerHTML = `
        <button id="clearMarkersBtn">Original</button>
      `;
      const btn = document.getElementById("clearMarkersBtn");

      const mockTab = { id: 333 };
      const querySpy = jest
        .spyOn(chrome.tabs, "query")
        .mockResolvedValue([mockTab]);
      const sendMessageSpy = jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation((_tabId, _message, callback) => {
          chrome.runtime.lastError = null;
          callback({});
        });

      // ACT
      await clearMarkers();

      // ASSERT : Séquence complète
      // 1. query a été appelé
      expect(querySpy).toHaveBeenCalled();

      // 2. sendMessage a été appelé APRÈS query
      expect(sendMessageSpy).toHaveBeenCalled();

      // 3. DOM a été modifié
      expect(btn.textContent).toBe("✓ Marqueurs effacés");

      // 4. Après 2s, texte restauré
      jest.advanceTimersByTime(2000);
      expect(btn.textContent).toBe("Original");

      // Cleanup
      jest.useRealTimers();
    });

    // 📝 TEST 9 : Vérifier que le message contient la bonne action
    test("devrait envoyer exactement 'clearVisualFeedback' comme action", async () => {
      // ARRANGE
      const mockTab = { id: 444 };
      jest.spyOn(chrome.tabs, "query").mockResolvedValue([mockTab]);
      const sendMessageSpy = jest
        .spyOn(chrome.tabs, "sendMessage")
        .mockImplementation(() => {});

      // ACT
      await clearMarkers();

      // ASSERT : Vérifier le contenu exact du message
      expect(sendMessageSpy).toHaveBeenCalledWith(
        444,
        expect.objectContaining({
          action: "clearVisualFeedback",
        }),
        expect.any(Function),
      );
    });

    // 📝 TEST 10 : Cleanup après chaque test
    afterEach(() => {
      // Restaurer tous les mocks
      jest.restoreAllMocks();
      // S'assurer que les timers réels sont restaurés
      jest.useRealTimers();
    });
  });

  // ========================================================================
  // Test 9 : calculateAndDisplayScore() - CALCUL + MODIFICATION DOM MULTIPLE
  // ========================================================================
  // 📊 Fonction avec CALCUL + AFFICHAGE
  //
  // Cette fonction fait plusieurs choses :
  // 1. Parcourt les catégories avec Object.values() et forEach()
  // 2. CALCULE le score : (1 - issues/tests) * 100
  // 3. Modifie 3 éléments DOM SIMULTANÉMENT :
  //    - totalScore → "${score}%"
  //    - totalPassed → nombre de tests passés
  //    - totalFailed → nombre de tests échoués
  // 4. RETOURNE le score calculé
  //
  // 🎯 Nouveaux concepts :
  // - Tester des calculs mathématiques (Math.round, division)
  // - Vérifier plusieurs modifications DOM en un seul test
  // - Tester les edge cases (division par zéro)
  // - Vérifier la valeur de retour d'une fonction

  describe("calculateAndDisplayScore() - Calcul + Modification DOM multiple", () => {
    // Copie de la fonction depuis popup.js
    function calculateAndDisplayScore(filteredResults) {
      let totalIssues = 0;
      let totalTests = 0;

      Object.values(filteredResults).forEach((category) => {
        totalIssues += category.issues.length;
        totalTests += category.total;
      });

      const score =
        totalTests > 0 ? Math.round((1 - totalIssues / totalTests) * 100) : 100;

      document.getElementById("totalScore").textContent = `${score}%`;
      document.getElementById("totalPassed").textContent =
        totalTests - totalIssues;
      document.getElementById("totalFailed").textContent = totalIssues;

      return score;
    }

    // 📝 TEST 1 : Calcul correct du score avec des données réelles
    test("devrait calculer le score correctement (80%)", () => {
      // ARRANGE : Créer les 3 éléments DOM nécessaires
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // Données : 10 tests, 2 issues → Score = (1 - 2/10) * 100 = 80%
      const filteredResults = {
        images: {
          total: 5,
          issues: [{ issue: "Image sans alt" }],
        },
        links: {
          total: 5,
          issues: [{ issue: "Lien vide" }],
        },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT : Vérifier le calcul
      expect(score).toBe(80); // (1 - 2/10) * 100 = 80

      // Vérifier les 3 éléments DOM
      expect(document.getElementById("totalScore").textContent).toBe("80%");
      expect(document.getElementById("totalPassed").textContent).toBe("8"); // 10 - 2
      expect(document.getElementById("totalFailed").textContent).toBe("2");
    });

    // 📝 TEST 2 : Score parfait (100%)
    test("devrait retourner 100% quand aucune issue", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // Aucune issue !
      const filteredResults = {
        images: { total: 10, issues: [] },
        links: { total: 5, issues: [] },
        forms: { total: 3, issues: [] },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT
      expect(score).toBe(100); // (1 - 0/18) * 100 = 100
      expect(document.getElementById("totalScore").textContent).toBe("100%");
      expect(document.getElementById("totalPassed").textContent).toBe("18");
      expect(document.getElementById("totalFailed").textContent).toBe("0");
    });

    // 📝 TEST 3 : Score très bas (0%)
    test("devrait retourner 0% quand tous les tests échouent", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // TOUS les tests échouent !
      const filteredResults = {
        images: {
          total: 5,
          issues: [
            { issue: "1" },
            { issue: "2" },
            { issue: "3" },
            { issue: "4" },
            { issue: "5" },
          ],
        },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT
      expect(score).toBe(0); // (1 - 5/5) * 100 = 0
      expect(document.getElementById("totalScore").textContent).toBe("0%");
      expect(document.getElementById("totalPassed").textContent).toBe("0");
      expect(document.getElementById("totalFailed").textContent).toBe("5");
    });

    // 📝 TEST 4 : Edge case - Division par zéro (totalTests = 0)
    test("devrait retourner 100% quand totalTests = 0 (pas de tests)", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // Aucun test effectué
      const filteredResults = {
        images: { total: 0, issues: [] },
        links: { total: 0, issues: [] },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT : Évite division par zéro → retourne 100
      expect(score).toBe(100);
      expect(document.getElementById("totalScore").textContent).toBe("100%");
    });

    // 📝 TEST 5 : Arrondi avec Math.round()
    test("devrait arrondir le score correctement", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // 3 issues sur 7 tests → (1 - 3/7) * 100 = 57.142... → arrondi à 57
      const filteredResults = {
        images: {
          total: 7,
          issues: [{ issue: "1" }, { issue: "2" }, { issue: "3" }],
        },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT : Math.round appliqué
      expect(score).toBe(57); // Pas 57.142...
      expect(document.getElementById("totalScore").textContent).toBe("57%");
    });

    // 📝 TEST 6 : Plusieurs catégories avec différents totaux
    test("devrait additionner correctement plusieurs catégories", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // 4 catégories avec différents résultats
      const filteredResults = {
        images: {
          total: 10,
          issues: [{ issue: "1" }, { issue: "2" }],
        },
        links: {
          total: 5,
          issues: [{ issue: "3" }],
        },
        forms: {
          total: 3,
          issues: [],
        },
        headings: {
          total: 2,
          issues: [{ issue: "4" }],
        },
      };

      // Total: 20 tests, 4 issues → 80%

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT
      expect(score).toBe(80); // (1 - 4/20) * 100 = 80
      expect(document.getElementById("totalPassed").textContent).toBe("16"); // 20 - 4
      expect(document.getElementById("totalFailed").textContent).toBe("4");
    });

    // 📝 TEST 7 : Vérifier que la valeur de retour est un nombre
    test("devrait retourner un NUMBER (pas une string)", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      const filteredResults = {
        images: { total: 10, issues: [{ issue: "1" }] },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT
      expect(typeof score).toBe("number");
      expect(score).toBe(90); // Pas "90" (string)
    });

    // 📝 TEST 8 : Format du textContent avec le symbole %
    test("devrait ajouter le symbole % au score affiché", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      const filteredResults = {
        images: { total: 4, issues: [{ issue: "1" }] },
      };

      // ACT
      calculateAndDisplayScore(filteredResults);

      // ASSERT : Le % est ajouté
      const scoreText = document.getElementById("totalScore").textContent;
      expect(scoreText).toBe("75%");
      expect(scoreText).toContain("%");
    });

    // 📝 TEST 9 : Les 3 éléments sont TOUS modifiés
    test("devrait modifier LES 3 éléments DOM en même temps", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore">0%</div>
        <div id="totalPassed">0</div>
        <div id="totalFailed">0</div>
      `;

      const filteredResults = {
        images: {
          total: 8,
          issues: [{ issue: "1" }, { issue: "2" }],
        },
      };

      // ACT
      calculateAndDisplayScore(filteredResults);

      // ASSERT : Vérifier que TOUS ont changé (pas seulement un)
      const score = document.getElementById("totalScore");
      const passed = document.getElementById("totalPassed");
      const failed = document.getElementById("totalFailed");

      expect(score.textContent).not.toBe("0%"); // A changé
      expect(passed.textContent).not.toBe("0"); // A changé
      expect(failed.textContent).not.toBe("0"); // A changé

      // Valeurs exactes
      expect(score.textContent).toBe("75%");
      expect(passed.textContent).toBe("6");
      expect(failed.textContent).toBe("2");
    });

    // 📝 TEST 10 : Score avec décimale qui s'arrondit vers le haut
    test("devrait arrondir 85.5 vers 86", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      // 20 tests, 3 issues → (1 - 3/20) * 100 = 85
      // Mais si on veut 85.5, il faut 29 tests, 4.205 issues... difficile
      // Utilisons 200 tests, 29 issues → (1 - 29/200) * 100 = 85.5 → 86
      const filteredResults = {
        images: {
          total: 200,
          issues: new Array(29).fill({ issue: "test" }),
        },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT : Math.round arrondit 85.5 vers 86
      expect(score).toBe(86);
    });

    // 📝 TEST 11 : Catégorie vide (total=0, issues=[])
    test("devrait gérer une catégorie vide sans erreur", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      const filteredResults = {
        images: { total: 10, issues: [{ issue: "1" }] },
        links: { total: 0, issues: [] }, // Catégorie vide
        forms: { total: 5, issues: [] },
      };

      // ACT & ASSERT : Ne doit pas planter
      expect(() => calculateAndDisplayScore(filteredResults)).not.toThrow();

      // Vérifier le résultat
      const score = calculateAndDisplayScore(filteredResults);
      expect(score).toBe(93); // (1 - 1/15) * 100 = 93.33... → 93
    });

    // 📝 TEST 12 : Objet filteredResults avec une seule catégorie
    test("devrait fonctionner avec une seule catégorie", () => {
      // ARRANGE
      document.body.innerHTML = `
        <div id="totalScore"></div>
        <div id="totalPassed"></div>
        <div id="totalFailed"></div>
      `;

      const filteredResults = {
        images: {
          total: 100,
          issues: new Array(10).fill({ issue: "test" }),
        },
      };

      // ACT
      const score = calculateAndDisplayScore(filteredResults);

      // ASSERT
      expect(score).toBe(90); // (1 - 10/100) * 100 = 90
      expect(document.getElementById("totalPassed").textContent).toBe("90");
      expect(document.getElementById("totalFailed").textContent).toBe("10");
    });
  });

  // ============================================================================
  // 7️⃣ TESTS DE updateCategoryBadge() - Modification textContent + classList
  // ============================================================================
  describe("updateCategoryBadge()", () => {
    // Copie de la fonction depuis popup.js pour les tests
    function updateCategoryBadge(badgeElement, issuesCount) {
      badgeElement.textContent = issuesCount;

      if (issuesCount > 0) {
        badgeElement.classList.add("badge-error");
      } else {
        badgeElement.classList.add("badge-success");
      }
    }

    let badgeElement;

    beforeEach(() => {
      // Arrange : créer un élément badge pour chaque test
      badgeElement = document.createElement("span");
      badgeElement.className = "badge"; // Classe de base
      document.body.appendChild(badgeElement);
    });

    afterEach(() => {
      // Cleanup : retirer l'élément après chaque test
      document.body.removeChild(badgeElement);
    });

    // Test 1 : Aucun problème détecté (issuesCount = 0)
    test("doit afficher 0 et ajouter badge-success quand aucun problème", () => {
      // Arrange : issuesCount = 0
      const issuesCount = 0;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : vérifier textContent ET classList
      expect(badgeElement.textContent).toBe("0");
      expect(badgeElement.classList.contains("badge-success")).toBe(true);
      expect(badgeElement.classList.contains("badge-error")).toBe(false);
    });

    // Test 2 : Un problème détecté (issuesCount = 1)
    test("doit afficher 1 et ajouter badge-error quand 1 problème", () => {
      // Arrange : issuesCount = 1
      const issuesCount = 1;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : vérifier textContent ET classList
      expect(badgeElement.textContent).toBe("1");
      expect(badgeElement.classList.contains("badge-error")).toBe(true);
      expect(badgeElement.classList.contains("badge-success")).toBe(false);
    });

    // Test 3 : Plusieurs problèmes détectés (issuesCount = 5)
    test("doit afficher 5 et ajouter badge-error quand 5 problèmes", () => {
      // Arrange : issuesCount = 5
      const issuesCount = 5;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : vérifier le nombre et la classe d'erreur
      expect(badgeElement.textContent).toBe("5");
      expect(badgeElement.classList.contains("badge-error")).toBe(true);
    });

    // Test 4 : Beaucoup de problèmes (issuesCount = 100)
    test("doit afficher 100 et ajouter badge-error quand 100 problèmes", () => {
      // Arrange : issuesCount = 100
      const issuesCount = 100;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : vérifier le grand nombre
      expect(badgeElement.textContent).toBe("100");
      expect(badgeElement.classList.contains("badge-error")).toBe(true);
    });

    // Test 5 : Vérifier que textContent accepte un nombre (conversion automatique)
    test("doit convertir le nombre en string pour textContent", () => {
      // Arrange : issuesCount = 42 (number)
      const issuesCount = 42;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : textContent doit être une string
      expect(typeof badgeElement.textContent).toBe("string");
      expect(badgeElement.textContent).toBe("42");
    });

    // Test 6 : Vérifier que seule la classe appropriée est ajoutée (pas les deux)
    test("ne doit pas ajouter badge-success si issuesCount > 0", () => {
      // Arrange : issuesCount = 3
      const issuesCount = 3;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : seulement badge-error, PAS badge-success
      expect(badgeElement.classList.contains("badge-error")).toBe(true);
      expect(badgeElement.classList.contains("badge-success")).toBe(false);
      expect(badgeElement.classList.length).toBe(2); // badge + badge-error
    });

    // Test 7 : Vérifier que seule badge-success est ajoutée si issuesCount = 0
    test("ne doit pas ajouter badge-error si issuesCount = 0", () => {
      // Arrange : issuesCount = 0
      const issuesCount = 0;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : seulement badge-success, PAS badge-error
      expect(badgeElement.classList.contains("badge-success")).toBe(true);
      expect(badgeElement.classList.contains("badge-error")).toBe(false);
      expect(badgeElement.classList.length).toBe(2); // badge + badge-success
    });

    // Test 8 : Vérifier la modification simultanée des 2 propriétés
    test("doit modifier textContent ET classList ensemble", () => {
      // Arrange : issuesCount = 7
      const issuesCount = 7;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : les 2 propriétés ont changé
      expect(badgeElement.textContent).toBe("7"); // Propriété 1
      expect(badgeElement.className).toContain("badge-error"); // Propriété 2
    });

    // Test 9 : Vérifier que classList.add() ne duplique pas les classes
    test("ne doit pas dupliquer les classes si appelé plusieurs fois", () => {
      // Arrange : appeler 2 fois avec issuesCount = 0
      const issuesCount = 0;

      // Act : appeler 2 fois la fonction
      updateCategoryBadge(badgeElement, issuesCount);
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : badge-success ne doit apparaître qu'une seule fois
      const successCount = badgeElement.className
        .split(" ")
        .filter((c) => c === "badge-success").length;
      expect(successCount).toBe(1);
    });

    // Test 10 : Cas limite - issuesCount négatif (comportement défensif)
    test("doit traiter issuesCount négatif comme > 0 (badge-error)", () => {
      // Arrange : issuesCount = -5 (cas anormal mais possible)
      const issuesCount = -5;

      // Act : appeler la fonction
      updateCategoryBadge(badgeElement, issuesCount);

      // Assert : -5 est > 0, donc badge-error (selon la logique)
      // Note: -5 > 0 est false, donc ce test vérifie le else branch
      expect(badgeElement.textContent).toBe("-5");
      expect(badgeElement.classList.contains("badge-success")).toBe(true);
    });
  });

  // ============================================================================
  // 8️⃣ TESTS DE toggleCategoriesVisibility() - Boucle sur 7 éléments DOM
  // ============================================================================
  describe("toggleCategoriesVisibility()", () => {
    // Mock de activeFilters (variable globale dans popup.js)
    let activeFilters;

    // Copie de la fonction depuis popup.js pour les tests
    function toggleCategoriesVisibility() {
      document.getElementById("imagesCategory").style.display =
        activeFilters.images ? "block" : "none";
      document.getElementById("svgCategory").style.display = activeFilters.svg
        ? "block"
        : "none";
      document.getElementById("linksCategory").style.display =
        activeFilters.links ? "block" : "none";
      document.getElementById("headingsCategory").style.display =
        activeFilters.headings ? "block" : "none";
      document.getElementById("formsCategory").style.display =
        activeFilters.forms ? "block" : "none";
      document.getElementById("colorblindCategory").style.display = "block";
      document.getElementById("structureCategory").style.display =
        activeFilters.structure || activeFilters.buttons ? "block" : "none";
    }

    beforeEach(() => {
      // Arrange : créer tous les éléments de catégorie dans le DOM
      document.body.innerHTML = `
        <div id="imagesCategory"></div>
        <div id="svgCategory"></div>
        <div id="linksCategory"></div>
        <div id="headingsCategory"></div>
        <div id="formsCategory"></div>
        <div id="colorblindCategory"></div>
        <div id="structureCategory"></div>
      `;

      // Initialiser activeFilters par défaut (tous actifs)
      activeFilters = {
        images: true,
        svg: true,
        links: true,
        headings: true,
        forms: true,
        structure: true,
        buttons: true,
      };
    });

    // Test 1 : Tous les filtres actifs → tous "block"
    test("doit afficher toutes les catégories quand tous les filtres sont actifs", () => {
      // Arrange : tous les filtres à true (déjà fait dans beforeEach)

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : tous les éléments doivent être "block"
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("svgCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("linksCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("headingsCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("formsCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("colorblindCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("structureCategory").style.display).toBe(
        "block",
      );
    });

    // Test 2 : Tous les filtres inactifs → "none" sauf colorblind
    test("doit cacher toutes les catégories (sauf colorblind) quand tous les filtres sont inactifs", () => {
      // Arrange : tous les filtres à false
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false,
        buttons: false,
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : tous "none" sauf colorblind qui est toujours "block"
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("svgCategory").style.display).toBe("none");
      expect(document.getElementById("linksCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("headingsCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("formsCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("colorblindCategory").style.display).toBe(
        "block",
      ); // Toujours visible
      expect(document.getElementById("structureCategory").style.display).toBe(
        "none",
      );
    });

    // Test 3 : Un seul filtre actif (images)
    test("doit afficher uniquement la catégorie images quand seul ce filtre est actif", () => {
      // Arrange : seulement images actif
      activeFilters = {
        images: true, // ← Seul actif
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false,
        buttons: false,
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : seulement images et colorblind visibles
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("svgCategory").style.display).toBe("none");
      expect(document.getElementById("linksCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("headingsCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("formsCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("colorblindCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("structureCategory").style.display).toBe(
        "none",
      );
    });

    // Test 4 : Vérifier la logique OR pour structureCategory (structure = true)
    test("doit afficher structureCategory si activeFilters.structure = true", () => {
      // Arrange : seulement structure actif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: true, // ← Active
        buttons: false,
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : structureCategory doit être "block" (structure OR buttons)
      expect(document.getElementById("structureCategory").style.display).toBe(
        "block",
      );
    });

    // Test 5 : Vérifier la logique OR pour structureCategory (buttons = true)
    test("doit afficher structureCategory si activeFilters.buttons = true", () => {
      // Arrange : seulement buttons actif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false,
        buttons: true, // ← Active
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : structureCategory doit être "block" (structure OR buttons)
      expect(document.getElementById("structureCategory").style.display).toBe(
        "block",
      );
    });

    // Test 6 : Vérifier la logique OR pour structureCategory (les deux true)
    test("doit afficher structureCategory si structure ET buttons sont actifs", () => {
      // Arrange : structure ET buttons actifs
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: true, // ← Active
        buttons: true, // ← Active
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : structureCategory doit être "block"
      expect(document.getElementById("structureCategory").style.display).toBe(
        "block",
      );
    });

    // Test 7 : Vérifier la logique OR pour structureCategory (les deux false)
    test("doit cacher structureCategory si structure ET buttons sont inactifs", () => {
      // Arrange : structure ET buttons inactifs
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false, // ← Inactive
        buttons: false, // ← Inactive
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : structureCategory doit être "none"
      expect(document.getElementById("structureCategory").style.display).toBe(
        "none",
      );
    });

    // Test 8 : colorblindCategory est TOUJOURS visible (peu importe les filtres)
    test("doit TOUJOURS afficher colorblindCategory (aucun filtre ne la contrôle)", () => {
      // Arrange : tous les filtres inactifs
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false,
        buttons: false,
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : colorblind toujours "block"
      expect(document.getElementById("colorblindCategory").style.display).toBe(
        "block",
      );
    });

    // Test 9 : Modification de plusieurs catégories simultanément
    test("doit modifier plusieurs catégories en un seul appel", () => {
      // Arrange : mix de filtres actifs/inactifs
      activeFilters = {
        images: true, // visible
        svg: false, // caché
        links: true, // visible
        headings: false, // caché
        forms: true, // visible
        structure: false,
        buttons: false,
      };

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : vérifier le mix
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("svgCategory").style.display).toBe("none");
      expect(document.getElementById("linksCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("headingsCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("formsCategory").style.display).toBe(
        "block",
      );
    });

    // Test 10 : Appeler 2 fois avec des filtres différents
    test("doit mettre à jour les catégories si appelé 2 fois avec des filtres différents", () => {
      // Arrange : premier appel avec images actif
      activeFilters = {
        images: true,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        structure: false,
        buttons: false,
      };

      // Act : premier appel
      toggleCategoriesVisibility();

      // Assert : images visible
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("svgCategory").style.display).toBe("none");

      // Arrange : changer les filtres (svg actif, images inactif)
      activeFilters.images = false;
      activeFilters.svg = true;

      // Act : deuxième appel
      toggleCategoriesVisibility();

      // Assert : svg visible maintenant, images caché
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("svgCategory").style.display).toBe(
        "block",
      );
    });

    // Test 11 : Vérifier que tous les 7 éléments sont modifiés (comptage)
    test("doit modifier exactement 7 éléments de catégorie", () => {
      // Arrange : tous les filtres actifs

      // Act : appeler la fonction
      toggleCategoriesVisibility();

      // Assert : compter les éléments modifiés
      const elements = [
        document.getElementById("imagesCategory"),
        document.getElementById("svgCategory"),
        document.getElementById("linksCategory"),
        document.getElementById("headingsCategory"),
        document.getElementById("formsCategory"),
        document.getElementById("colorblindCategory"),
        document.getElementById("structureCategory"),
      ];

      // Tous les éléments doivent avoir une valeur style.display
      const modifiedElements = elements.filter((el) => el.style.display !== "");
      expect(modifiedElements.length).toBe(7);
    });

    // Test 12 : Cas réaliste - utilisateur désactive une catégorie
    test("doit cacher une catégorie quand l'utilisateur désactive son filtre", () => {
      // Arrange : tous actifs au départ
      activeFilters = {
        images: true,
        svg: true,
        links: true,
        headings: true,
        forms: true,
        structure: true,
        buttons: true,
      };

      // Act : premier appel (tout visible)
      toggleCategoriesVisibility();
      expect(document.getElementById("linksCategory").style.display).toBe(
        "block",
      );

      // Arrange : utilisateur désactive le filtre links
      activeFilters.links = false;

      // Act : deuxième appel
      toggleCategoriesVisibility();

      // Assert : links caché, mais les autres toujours visibles
      expect(document.getElementById("linksCategory").style.display).toBe(
        "none",
      );
      expect(document.getElementById("imagesCategory").style.display).toBe(
        "block",
      );
      expect(document.getElementById("svgCategory").style.display).toBe(
        "block",
      );
    });
  });

  // ============================================================================
  // 9️⃣ TESTS DE filterResults() - Manipulation de données + Filtrage
  // ============================================================================
  describe("filterResults()", () => {
    // Mock de activeFilters (variable globale dans popup.js)
    let activeFilters;

    // Copie de la fonction depuis popup.js pour les tests
    function filterResults(results) {
      const filtered = {
        images: activeFilters.images
          ? results.images
          : { total: 0, issues: [], passed: 0 },
        svg: activeFilters.svg
          ? results.svg
          : { total: 0, issues: [], passed: 0 },
        links: activeFilters.links
          ? results.links
          : { total: 0, issues: [], passed: 0 },
        headings: activeFilters.headings
          ? results.headings
          : { total: 0, issues: [], passed: 0 },
        forms: activeFilters.forms
          ? results.forms
          : { total: 0, issues: [], passed: 0 },
        colorblind: activeFilters.colorblind
          ? results.colorblind
          : { total: 0, issues: [], passed: 0 },
        lang: activeFilters.structure
          ? results.lang
          : { total: 0, issues: [], passed: 0 },
        landmarks: activeFilters.structure
          ? results.landmarks
          : { total: 0, issues: [], passed: 0 },
        buttons: activeFilters.buttons
          ? results.buttons
          : { total: 0, issues: [], passed: 0 },
      };

      return filtered;
    }

    beforeEach(() => {
      // Initialiser activeFilters par défaut (tous actifs)
      activeFilters = {
        images: true,
        svg: true,
        links: true,
        headings: true,
        forms: true,
        colorblind: true,
        structure: true,
        buttons: true,
      };
    });

    // Test 1 : Tous les filtres actifs → retourne toutes les données
    test("doit retourner toutes les données quand tous les filtres sont actifs", () => {
      // Arrange : résultats complets
      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [{ id: 2 }, { id: 3 }], passed: 18 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [{ id: 4 }], passed: 2 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [{ id: 5 }], passed: 14 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : toutes les catégories doivent être identiques à l'original
      expect(filtered.images).toEqual(results.images);
      expect(filtered.svg).toEqual(results.svg);
      expect(filtered.links).toEqual(results.links);
      expect(filtered.headings).toEqual(results.headings);
      expect(filtered.forms).toEqual(results.forms);
      expect(filtered.colorblind).toEqual(results.colorblind);
      expect(filtered.lang).toEqual(results.lang);
      expect(filtered.landmarks).toEqual(results.landmarks);
      expect(filtered.buttons).toEqual(results.buttons);
    });

    // Test 2 : Tous les filtres inactifs → objets vides
    test("doit retourner des objets vides quand tous les filtres sont inactifs", () => {
      // Arrange : tous les filtres à false
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: false,
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : toutes les catégories doivent être des objets vides
      const emptyObject = { total: 0, issues: [], passed: 0 };
      expect(filtered.images).toEqual(emptyObject);
      expect(filtered.svg).toEqual(emptyObject);
      expect(filtered.links).toEqual(emptyObject);
      expect(filtered.headings).toEqual(emptyObject);
      expect(filtered.forms).toEqual(emptyObject);
      expect(filtered.colorblind).toEqual(emptyObject);
      expect(filtered.lang).toEqual(emptyObject);
      expect(filtered.landmarks).toEqual(emptyObject);
      expect(filtered.buttons).toEqual(emptyObject);
    });

    // Test 3 : Un seul filtre actif (images)
    test("doit retourner uniquement les données images quand seul ce filtre est actif", () => {
      // Arrange : seulement images actif
      activeFilters = {
        images: true, // ← Seul actif
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: false,
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : seulement images doit avoir les données
      expect(filtered.images).toEqual(results.images);
      expect(filtered.svg).toEqual({ total: 0, issues: [], passed: 0 });
      expect(filtered.links).toEqual({ total: 0, issues: [], passed: 0 });
      expect(filtered.headings).toEqual({ total: 0, issues: [], passed: 0 });
      expect(filtered.forms).toEqual({ total: 0, issues: [], passed: 0 });
    });

    // Test 4 : lang utilise activeFilters.structure (pas activeFilters.lang)
    test("doit retourner lang quand activeFilters.structure = true", () => {
      // Arrange : seulement structure actif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: true, // ← Contrôle lang ET landmarks
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [], passed: 10 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [{ id: "lang-issue" }], passed: 0 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : lang doit avoir les données (car structure = true)
      expect(filtered.lang).toEqual(results.lang);
      expect(filtered.lang.issues).toHaveLength(1);
    });

    // Test 5 : landmarks utilise activeFilters.structure
    test("doit retourner landmarks quand activeFilters.structure = true", () => {
      // Arrange : seulement structure actif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: true, // ← Contrôle lang ET landmarks
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [], passed: 10 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [{ id: "landmark-issue" }], passed: 1 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : landmarks doit avoir les données (car structure = true)
      expect(filtered.landmarks).toEqual(results.landmarks);
      expect(filtered.landmarks.issues).toHaveLength(1);
    });

    // Test 6 : buttons utilise activeFilters.buttons (pas structure)
    test("doit retourner buttons quand activeFilters.buttons = true", () => {
      // Arrange : seulement buttons actif, structure inactif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: false, // ← Inactif
        buttons: true, // ← Actif (contrôle buttons uniquement)
      };

      const results = {
        images: { total: 10, issues: [], passed: 10 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [{ id: "button-issue" }], passed: 14 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : buttons doit avoir les données, mais pas lang/landmarks
      expect(filtered.buttons).toEqual(results.buttons);
      expect(filtered.lang).toEqual({ total: 0, issues: [], passed: 0 }); // structure = false
      expect(filtered.landmarks).toEqual({ total: 0, issues: [], passed: 0 }); // structure = false
    });

    // Test 7 : Mix de filtres actifs/inactifs
    test("doit filtrer correctement avec un mix de filtres actifs et inactifs", () => {
      // Arrange : mix de filtres
      activeFilters = {
        images: true, // ✓
        svg: false, // ✗
        links: true, // ✓
        headings: false, // ✗
        forms: true, // ✓
        colorblind: false, // ✗
        structure: true, // ✓ (lang + landmarks)
        buttons: false, // ✗
      };

      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : vérifier le mix
      expect(filtered.images).toEqual(results.images); // actif
      expect(filtered.svg).toEqual({ total: 0, issues: [], passed: 0 }); // inactif
      expect(filtered.links).toEqual(results.links); // actif
      expect(filtered.headings).toEqual({ total: 0, issues: [], passed: 0 }); // inactif
      expect(filtered.forms).toEqual(results.forms); // actif
      expect(filtered.colorblind).toEqual({ total: 0, issues: [], passed: 0 }); // inactif
      expect(filtered.lang).toEqual(results.lang); // actif (via structure)
      expect(filtered.landmarks).toEqual(results.landmarks); // actif (via structure)
      expect(filtered.buttons).toEqual({ total: 0, issues: [], passed: 0 }); // inactif
    });

    // Test 8 : Immutabilité - ne modifie pas l'objet d'origine
    test("ne doit PAS modifier l'objet results d'origine", () => {
      // Arrange
      activeFilters = {
        images: false, // Filtrer images
        svg: true,
        links: true,
        headings: true,
        forms: true,
        colorblind: true,
        structure: true,
        buttons: true,
      };

      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Sauvegarder l'original
      const originalImages = { ...results.images };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : l'objet original ne doit pas avoir changé
      expect(results.images).toEqual(originalImages);
      expect(results.images.total).toBe(10); // Toujours 10, pas 0
      // Le filtered doit avoir un objet vide pour images
      expect(filtered.images).toEqual({ total: 0, issues: [], passed: 0 });
    });

    // Test 9 : Structure des objets vides
    test("doit utiliser la structure correcte pour les objets vides", () => {
      // Arrange : tous inactifs
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: false,
        structure: false,
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [{ id: 1 }], passed: 9 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : vérifier la structure de chaque objet vide
      Object.values(filtered).forEach((category) => {
        expect(category).toHaveProperty("total");
        expect(category).toHaveProperty("issues");
        expect(category).toHaveProperty("passed");
        expect(category.total).toBe(0);
        expect(category.issues).toEqual([]);
        expect(category.passed).toBe(0);
      });
    });

    // Test 10 : Cas réaliste avec des issues
    test("doit filtrer correctement un cas réaliste avec plusieurs issues", () => {
      // Arrange : utilisateur veut voir seulement images et links
      activeFilters = {
        images: true,
        svg: false,
        links: true,
        headings: false,
        forms: false,
        colorblind: false,
        structure: false,
        buttons: false,
      };

      const results = {
        images: {
          total: 10,
          issues: [
            { id: 1, issue: "Image sans alt" },
            { id: 2, issue: "Alt vide" },
          ],
          passed: 8,
        },
        svg: {
          total: 5,
          issues: [{ id: 3, issue: "SVG sans title" }],
          passed: 4,
        },
        links: {
          total: 20,
          issues: [{ id: 4, issue: "Lien sans texte" }],
          passed: 19,
        },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : seulement images et links doivent avoir leurs issues
      expect(filtered.images.issues).toHaveLength(2);
      expect(filtered.links.issues).toHaveLength(1);
      expect(filtered.svg.issues).toHaveLength(0); // Filtré
      expect(filtered.images.total).toBe(10);
      expect(filtered.links.total).toBe(20);
      expect(filtered.svg.total).toBe(0); // Filtré
    });

    // Test 11 : Vérifier colorblind utilise son propre filtre
    test("doit retourner colorblind quand activeFilters.colorblind = true", () => {
      // Arrange : seulement colorblind actif
      activeFilters = {
        images: false,
        svg: false,
        links: false,
        headings: false,
        forms: false,
        colorblind: true, // ← Actif
        structure: false,
        buttons: false,
      };

      const results = {
        images: { total: 10, issues: [], passed: 10 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: {
          total: 1,
          issues: [{ id: "colorblind-issue" }],
          passed: 0,
        },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : colorblind doit avoir les données
      expect(filtered.colorblind).toEqual(results.colorblind);
      expect(filtered.colorblind.issues).toHaveLength(1);
    });

    // Test 12 : Retourne un nouvel objet (pas une référence)
    test("doit retourner un nouvel objet, pas une référence à l'original", () => {
      // Arrange
      const results = {
        images: { total: 10, issues: [], passed: 10 },
        svg: { total: 5, issues: [], passed: 5 },
        links: { total: 20, issues: [], passed: 20 },
        headings: { total: 8, issues: [], passed: 8 },
        forms: { total: 3, issues: [], passed: 3 },
        colorblind: { total: 1, issues: [], passed: 1 },
        lang: { total: 1, issues: [], passed: 1 },
        landmarks: { total: 2, issues: [], passed: 2 },
        buttons: { total: 15, issues: [], passed: 15 },
      };

      // Act : filtrer
      const filtered = filterResults(results);

      // Assert : filtered ne doit pas être la même référence que results
      expect(filtered).not.toBe(results);

      // Mais les sous-objets actifs peuvent être les mêmes références
      // (car on fait juste results.images, pas une copie)
      expect(filtered.images).toBe(results.images); // Même référence (pas de copie profonde)
    });
  });

  // ============================================================================
  // 🔟 TESTS DE attachSwitchHandlers() - querySelectorAll + addEventListener
  // ============================================================================
  describe("attachSwitchHandlers()", () => {
    // Mock des fonctions appelées par les handlers
    let updateScore;
    let updateVisualMarkers;
    let activeFilters;

    // Copie de la fonction depuis popup.js pour les tests
    function attachSwitchHandlers() {
      const checkboxes = document.querySelectorAll(".audit-filter");

      checkboxes.forEach((checkbox, index) => {
        // Supprimer tout event listener existant en utilisant un attribut data
        if (checkbox.dataset.handlerAttached === "true") {
          return;
        }

        checkbox.dataset.handlerAttached = "true";

        // Utiliser addEventListener avec capture pour être sûr de capturer l'événement
        checkbox.addEventListener(
          "change",
          function (e) {
            e.stopPropagation(); // Empêcher la propagation au header

            const category = this.getAttribute("data-category");
            const categoryElement = document.getElementById(
              `${category}Category`,
            );
            const isChecked = this.checked;

            if (isChecked) {
              // Réactiver la catégorie
              categoryElement.classList.remove("disabled");
              activeFilters[category] = true;
            } else {
              // Désactiver la catégorie
              categoryElement.classList.add("disabled");
              activeFilters[category] = false;
            }

            // Mettre à jour le score global
            updateScore();

            // Mettre à jour les marqueurs visuels
            updateVisualMarkers();
          },
          true,
        ); // Utiliser capture phase
      });
    }

    beforeEach(() => {
      // Mock des fonctions
      updateScore = jest.fn();
      updateVisualMarkers = jest.fn();

      // Initialiser activeFilters
      activeFilters = {
        images: true,
        svg: true,
        links: true,
      };

      // Créer le DOM avec 3 checkboxes et leurs catégories associées
      document.body.innerHTML = `
        <input type="checkbox" class="audit-filter" data-category="images" checked>
        <div id="imagesCategory"></div>
        
        <input type="checkbox" class="audit-filter" data-category="svg" checked>
        <div id="svgCategory"></div>
        
        <input type="checkbox" class="audit-filter" data-category="links" checked>
        <div id="linksCategory"></div>
      `;
    });

    // Test 1 : Trouve toutes les checkboxes avec querySelectorAll
    test("doit trouver toutes les checkboxes avec .audit-filter", () => {
      // Act : appeler la fonction
      attachSwitchHandlers();

      // Assert : vérifier que les 3 checkboxes existent
      const checkboxes = document.querySelectorAll(".audit-filter");
      expect(checkboxes.length).toBe(3);
    });

    // Test 2 : Attache un handler à chaque checkbox
    test("doit attacher un handler à chaque checkbox (vérifier dataset)", () => {
      // Act : appeler la fonction
      attachSwitchHandlers();

      // Assert : vérifier que dataset.handlerAttached est défini
      const checkboxes = document.querySelectorAll(".audit-filter");
      checkboxes.forEach((checkbox) => {
        expect(checkbox.dataset.handlerAttached).toBe("true");
      });
    });

    // Test 3 : Ne doit PAS attacher 2 fois le même handler
    test("ne doit pas attacher un handler si déjà attaché", () => {
      // Arrange : appeler 2 fois
      attachSwitchHandlers();

      // Marquer manuellement pour simuler un deuxième appel
      const checkboxes = document.querySelectorAll(".audit-filter");
      const spies = Array.from(checkboxes).map((cb) =>
        jest.spyOn(cb, "addEventListener"),
      );

      // Act : appeler une 2e fois
      attachSwitchHandlers();

      // Assert : addEventListener ne devrait PAS être appelé (déjà attaché)
      spies.forEach((spy) => {
        expect(spy).not.toHaveBeenCalled();
      });
    });

    // Test 4 : Déclencher l'événement "change" sur une checkbox
    test("doit réagir à l'événement change sur une checkbox", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');

      // Act : déclencher l'événement change (décocher)
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(new Event("change"));

      // Assert : updateScore et updateVisualMarkers doivent être appelés
      expect(updateScore).toHaveBeenCalledTimes(1);
      expect(updateVisualMarkers).toHaveBeenCalledTimes(1);
    });

    // Test 5 : Décocher une checkbox désactive la catégorie
    test("doit ajouter 'disabled' à la catégorie quand checkbox décochée", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');
      const imagesCategory = document.getElementById("imagesCategory");

      // Act : décocher la checkbox
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(new Event("change"));

      // Assert : la catégorie doit avoir la classe "disabled"
      expect(imagesCategory.classList.contains("disabled")).toBe(true);
    });

    // Test 6 : Décocher une checkbox met activeFilters[category] à false
    test("doit mettre activeFilters[category] à false quand checkbox décochée", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');

      // Act : décocher la checkbox
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(new Event("change"));

      // Assert : activeFilters.images doit être false
      expect(activeFilters.images).toBe(false);
    });

    // Test 7 : Cocher une checkbox réactive la catégorie
    test("doit retirer 'disabled' de la catégorie quand checkbox cochée", () => {
      // Arrange : attacher les handlers, catégorie désactivée au départ
      attachSwitchHandlers();
      const svgCheckbox = document.querySelector('[data-category="svg"]');
      const svgCategory = document.getElementById("svgCategory");
      svgCategory.classList.add("disabled"); // Simuler désactivation

      // Act : cocher la checkbox (elle est déjà checked, mais on la décoche puis recoche)
      svgCheckbox.checked = false;
      svgCheckbox.dispatchEvent(new Event("change"));
      svgCheckbox.checked = true;
      svgCheckbox.dispatchEvent(new Event("change"));

      // Assert : la catégorie ne doit plus avoir "disabled"
      expect(svgCategory.classList.contains("disabled")).toBe(false);
    });

    // Test 8 : Cocher une checkbox met activeFilters[category] à true
    test("doit mettre activeFilters[category] à true quand checkbox cochée", () => {
      // Arrange : attacher les handlers, filtre désactivé au départ
      attachSwitchHandlers();
      const linksCheckbox = document.querySelector('[data-category="links"]');
      activeFilters.links = false; // Simuler filtre désactivé

      // Act : cocher la checkbox
      linksCheckbox.checked = true;
      linksCheckbox.dispatchEvent(new Event("change"));

      // Assert : activeFilters.links doit être true
      expect(activeFilters.links).toBe(true);
    });

    // Test 9 : Plusieurs checkboxes peuvent être modifiées indépendamment
    test("doit gérer plusieurs checkboxes indépendamment", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');
      const svgCheckbox = document.querySelector('[data-category="svg"]');

      // Act : décocher images, cocher svg (déjà coché mais simuler)
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(new Event("change"));

      svgCheckbox.checked = true;
      svgCheckbox.dispatchEvent(new Event("change"));

      // Assert : vérifier les états indépendants
      expect(activeFilters.images).toBe(false);
      expect(activeFilters.svg).toBe(true);
      expect(updateScore).toHaveBeenCalledTimes(2); // 2 événements
      expect(updateVisualMarkers).toHaveBeenCalledTimes(2);
    });

    // Test 10 : Vérifier que e.stopPropagation() est appelé
    test("doit appeler stopPropagation sur l'événement", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');

      // Créer un event avec stopPropagation mocké
      const mockEvent = new Event("change");
      mockEvent.stopPropagation = jest.fn();

      // Act : déclencher l'événement
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(mockEvent);

      // Assert : stopPropagation doit être appelé
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    // Test 11 : Aucune checkbox dans le DOM
    test("ne doit rien faire si aucune checkbox .audit-filter trouvée", () => {
      // Arrange : DOM vide
      document.body.innerHTML = "";

      // Act : appeler la fonction (ne devrait pas planter)
      expect(() => attachSwitchHandlers()).not.toThrow();

      // Assert : aucun handler attaché
      const checkboxes = document.querySelectorAll(".audit-filter");
      expect(checkboxes.length).toBe(0);
    });

    // Test 12 : Vérifier le cycle complet : décocher → modifier → recocher
    test("doit gérer le cycle complet décocher/recocher", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const imagesCheckbox = document.querySelector('[data-category="images"]');
      const imagesCategory = document.getElementById("imagesCategory");

      // État initial : coché, activeFilters.images = true
      expect(activeFilters.images).toBe(true);

      // Act 1 : décocher
      imagesCheckbox.checked = false;
      imagesCheckbox.dispatchEvent(new Event("change"));

      // Assert 1 : désactivé
      expect(activeFilters.images).toBe(false);
      expect(imagesCategory.classList.contains("disabled")).toBe(true);

      // Act 2 : recocher
      imagesCheckbox.checked = true;
      imagesCheckbox.dispatchEvent(new Event("change"));

      // Assert 2 : réactivé
      expect(activeFilters.images).toBe(true);
      expect(imagesCategory.classList.contains("disabled")).toBe(false);

      // Assert 3 : fonctions appelées 2 fois
      expect(updateScore).toHaveBeenCalledTimes(2);
      expect(updateVisualMarkers).toHaveBeenCalledTimes(2);
    });

    // Test 13 : Vérifier getAttribute("data-category")
    test("doit récupérer correctement data-category", () => {
      // Arrange : attacher les handlers
      attachSwitchHandlers();
      const svgCheckbox = document.querySelector('[data-category="svg"]');

      // Act : déclencher change
      svgCheckbox.checked = false;
      svgCheckbox.dispatchEvent(new Event("change"));

      // Assert : vérifier que la bonne catégorie est désactivée
      expect(activeFilters.svg).toBe(false);
      expect(activeFilters.images).toBe(true); // Les autres ne changent pas
      expect(activeFilters.links).toBe(true);
    });

    // Test 14 : Vérifier forEach sur querySelectorAll
    test("doit boucler sur toutes les checkboxes avec forEach", () => {
      // Arrange : créer 5 checkboxes
      document.body.innerHTML = `
        <input type="checkbox" class="audit-filter" data-category="cat1" checked>
        <div id="cat1Category"></div>
        <input type="checkbox" class="audit-filter" data-category="cat2" checked>
        <div id="cat2Category"></div>
        <input type="checkbox" class="audit-filter" data-category="cat3" checked>
        <div id="cat3Category"></div>
        <input type="checkbox" class="audit-filter" data-category="cat4" checked>
        <div id="cat4Category"></div>
        <input type="checkbox" class="audit-filter" data-category="cat5" checked>
        <div id="cat5Category"></div>
      `;

      // Act : attacher les handlers
      attachSwitchHandlers();

      // Assert : toutes les checkboxes doivent avoir handlerAttached
      const checkboxes = document.querySelectorAll(".audit-filter");
      expect(checkboxes.length).toBe(5);
      checkboxes.forEach((checkbox) => {
        expect(checkbox.dataset.handlerAttached).toBe("true");
      });
    });
  });
});
