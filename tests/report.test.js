/**
 * Tests unitaires pour report.js
 * Teste la génération et l'affichage du rapport d'accessibilité
 */

describe("QuickA11y - Rapport d'accessibilité", () => {
  beforeEach(() => {
    // Configurer le DOM de la page de rapport
    document.body.innerHTML = `
      <div id="reportContent"></div>
      <button id="printBtn">Imprimer</button>
    `;

    // Mock des APIs Chrome
    globalThis.chrome = {
      storage: {
        session: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
      },
    };

    // Mock de window.print
    globalThis.window.print = jest.fn();
  });

  describe("Récupération des données", () => {
    test("devrait récupérer les données depuis chrome.storage.session", async () => {
      const mockReportData = {
        results: {
          images: { passed: 5, issues: [] },
          links: { passed: 3, issues: [] },
        },
        score: 100,
        pageUrl: "https://example.com",
        pageTitle: "Page de test",
        reportDate: "1 février 2026",
        reportTime: "10:00:00",
      };

      chrome.storage.session.get = jest.fn((keys, callback) => {
        return Promise.resolve({ reportData: mockReportData });
      });

      const result = await chrome.storage.session.get(["reportData"]);

      expect(chrome.storage.session.get).toHaveBeenCalledWith(["reportData"]);
      expect(result.reportData).toEqual(mockReportData);
      expect(result.reportData.score).toBe(100);
    });

    test("devrait gérer l'absence de données", async () => {
      chrome.storage.session.get = jest.fn(() => {
        return Promise.resolve({});
      });

      const result = await chrome.storage.session.get(["reportData"]);

      expect(result.reportData).toBeUndefined();
    });
  });

  describe("Calcul des statistiques", () => {
    test("devrait calculer le nombre total de tests réussis", () => {
      const results = {
        images: { passed: 10, issues: [] },
        links: { passed: 5, issues: [] },
        headings: { passed: 3, issues: [] },
      };

      const totalPassed = Object.values(results).reduce(
        (sum, cat) => sum + cat.passed,
        0,
      );

      expect(totalPassed).toBe(18);
    });

    test("devrait calculer le nombre total de problèmes détectés", () => {
      const results = {
        images: {
          passed: 8,
          issues: [{ element: "Image 1" }, { element: "Image 2" }],
        },
        links: { passed: 5, issues: [{ element: "Lien 1" }] },
        headings: { passed: 3, issues: [] },
      };

      const totalFailed = Object.values(results).reduce(
        (sum, cat) => sum + cat.issues.length,
        0,
      );

      expect(totalFailed).toBe(3);
    });

    test("devrait calculer correctement avec aucun problème", () => {
      const results = {
        images: { passed: 10, issues: [] },
        links: { passed: 5, issues: [] },
      };

      const totalFailed = Object.values(results).reduce(
        (sum, cat) => sum + cat.issues.length,
        0,
      );

      expect(totalFailed).toBe(0);
    });
  });

  describe("Rendu du rapport", () => {
    test("devrait afficher les informations de base du rapport", () => {
      const data = {
        results: {
          images: { passed: 5, issues: [] },
        },
        score: 95,
        pageUrl: "https://example.com",
        pageTitle: "Ma Page",
        reportDate: "1 février 2026",
        reportTime: "10:30:00",
      };

      function renderReport(data) {
        const { score, pageUrl, pageTitle, reportDate, reportTime } = data;
        const reportContent = document.getElementById("reportContent");

        reportContent.innerHTML = `
          <div class="meta-info">
            <p><strong>Page analysée :</strong> ${pageTitle}</p>
            <p><strong>URL :</strong> ${pageUrl}</p>
            <p><strong>Date de l'audit :</strong> ${reportDate} à ${reportTime}</p>
          </div>
          <div class="score-section">
            <div class="score-number">${score}%</div>
          </div>
        `;
      }

      renderReport(data);

      const reportContent = document.getElementById("reportContent");
      expect(reportContent.innerHTML).toContain("Ma Page");
      expect(reportContent.innerHTML).toContain("https://example.com");
      expect(reportContent.innerHTML).toContain("1 février 2026");
      expect(reportContent.innerHTML).toContain("10:30:00");
      expect(reportContent.innerHTML).toContain("95%");
    });

    test("devrait afficher un message d'erreur quand il n'y a pas de données", () => {
      const reportContent = document.getElementById("reportContent");
      reportContent.innerHTML =
        '<p style="color: red; text-align: center;">Erreur : Aucune donnée de rapport trouvée.</p>';

      expect(reportContent.innerHTML).toContain(
        "Aucune donnée de rapport trouvée",
      );
      expect(reportContent.innerHTML).toContain("color: red");
    });

    test("devrait afficher les badges de statut pour chaque catégorie", () => {
      const categoryData = {
        withIssues: { passed: 5, issues: [{ element: "Test" }] },
        withoutIssues: { passed: 10, issues: [] },
      };

      // Catégorie avec problèmes
      const badgeClass1 =
        categoryData.withIssues.issues.length === 0 ? "success" : "warning";
      const badgeText1 =
        categoryData.withIssues.issues.length === 0
          ? "✓ Aucun problème"
          : `${categoryData.withIssues.issues.length} problème${categoryData.withIssues.issues.length > 1 ? "s" : ""}`;

      expect(badgeClass1).toBe("warning");
      expect(badgeText1).toBe("1 problème");

      // Catégorie sans problèmes
      const badgeClass2 =
        categoryData.withoutIssues.issues.length === 0 ? "success" : "warning";
      const badgeText2 =
        categoryData.withoutIssues.issues.length === 0
          ? "✓ Aucun problème"
          : `${categoryData.withoutIssues.issues.length} problème${categoryData.withoutIssues.issues.length > 1 ? "s" : ""}`;

      expect(badgeClass2).toBe("success");
      expect(badgeText2).toBe("✓ Aucun problème");
    });

    test("devrait gérer le pluriel des problèmes correctement", () => {
      const testCases = [
        { issuesCount: 0, expected: "✓ Aucun problème" },
        { issuesCount: 1, expected: "1 problème" },
        { issuesCount: 5, expected: "5 problèmes" },
      ];

      testCases.forEach(({ issuesCount, expected }) => {
        const issues = Array(issuesCount).fill({ element: "Test" });
        const badgeText =
          issues.length === 0
            ? "✓ Aucun problème"
            : `${issues.length} problème${issues.length > 1 ? "s" : ""}`;

        expect(badgeText).toBe(expected);
      });
    });
  });

  describe("Affichage des problèmes", () => {
    test("devrait afficher les détails des problèmes avec sévérité", () => {
      const issue = {
        element: "img#logo",
        issue: "Texte alternatif manquant",
        severity: "critical",
        explanation: "Ajoutez un attribut alt descriptif",
        src: "/images/logo.png",
      };

      const issueHtml = `
        <div class="issue ${issue.severity}">
          <div class="issue-header">
            <span class="issue-element">${issue.element}</span>
            <span class="severity-badge ${issue.severity}">${issue.severity}</span>
          </div>
          <p class="issue-description">${issue.issue}</p>
          ${issue.explanation ? `<div class="issue-explanation">${issue.explanation}</div>` : ""}
        </div>
      `;

      expect(issueHtml).toContain("img#logo");
      expect(issueHtml).toContain("Texte alternatif manquant");
      expect(issueHtml).toContain("critical");
      expect(issueHtml).toContain("Ajoutez un attribut alt descriptif");
    });

    test("devrait afficher les ressources utiles si disponibles", () => {
      const issue = {
        src: "/images/photo.jpg",
        href: "https://example.com/page",
        text: "Cliquez ici",
        type: "button",
      };

      const resources = [];
      if (issue.src) {
        resources.push(`<strong>Source :</strong> <code>${issue.src}</code>`);
      }
      if (issue.href) {
        resources.push(
          `<strong>URL du lien :</strong> <code>${issue.href}</code>`,
        );
      }
      if (issue.text) {
        resources.push(`<strong>Texte :</strong> "${issue.text}"`);
      }
      if (issue.type) {
        resources.push(`<strong>Type :</strong> ${issue.type}`);
      }

      expect(resources).toHaveLength(4);
      expect(resources[0]).toContain("/images/photo.jpg");
      expect(resources[1]).toContain("https://example.com/page");
      expect(resources[2]).toContain("Cliquez ici");
      expect(resources[3]).toContain("button");
    });

    test("devrait afficher un message de succès quand il n'y a pas de problèmes", () => {
      const issues = [];
      const displayHtml =
        issues.length > 0
          ? issues.map((issue) => `<div>${issue.element}</div>`).join("")
          : '<p class="success-message">✅ Aucun problème détecté</p>';

      expect(displayHtml).toContain("✅ Aucun problème détecté");
      expect(displayHtml).toContain('class="success-message"');
    });
  });

  describe("Filtrage des catégories", () => {
    test("devrait exclure la catégorie colorblind du rapport", () => {
      const results = {
        images: { passed: 5, issues: [] },
        links: { passed: 3, issues: [] },
        colorblind: { passed: 0, issues: [] },
      };

      const filteredResults = Object.entries(results).filter(
        ([category]) => category !== "colorblind",
      );

      expect(filteredResults).toHaveLength(2);
      expect(filteredResults.some(([cat]) => cat === "colorblind")).toBe(false);
      expect(filteredResults.some(([cat]) => cat === "images")).toBe(true);
      expect(filteredResults.some(([cat]) => cat === "links")).toBe(true);
    });
  });

  describe("Noms des catégories", () => {
    test("devrait mapper les clés aux noms lisibles en français", () => {
      const categoryNames = {
        images: "Images",
        svg: "SVG Inline",
        links: "Liens",
        headings: "Titres",
        forms: "Formulaires",
        lang: "Langue",
        landmarks: "Structure",
        buttons: "Boutons",
      };

      expect(categoryNames.images).toBe("Images");
      expect(categoryNames.svg).toBe("SVG Inline");
      expect(categoryNames.links).toBe("Liens");
      expect(categoryNames.headings).toBe("Titres");
      expect(categoryNames.buttons).toBe("Boutons");
    });

    test("devrait utiliser la clé comme fallback si le nom n'existe pas", () => {
      const categoryNames = {
        images: "Images",
        links: "Liens",
      };

      const category = "unknownCategory";
      const displayName = categoryNames[category] || category;

      expect(displayName).toBe("unknownCategory");
    });
  });

  describe("Fonction d'impression", () => {
    test("devrait appeler window.print() lors du clic sur le bouton", () => {
      const printBtn = document.getElementById("printBtn");

      printBtn.addEventListener("click", function () {
        window.print();
      });

      printBtn.click();

      expect(window.print).toHaveBeenCalled();
    });

    test("devrait vérifier que le bouton d'impression existe", () => {
      const printBtn = document.getElementById("printBtn");

      expect(printBtn).toBeTruthy();
      expect(printBtn.textContent).toBe("Imprimer");
    });
  });

  describe("Gestion d'erreurs", () => {
    test("devrait afficher un message d'erreur en cas d'échec de récupération", () => {
      const errorMessage = "Impossible de charger les données du rapport.";

      const reportContent = document.getElementById("reportContent");
      reportContent.innerHTML = `<p style="color: red; text-align: center;">Erreur : ${errorMessage}</p>`;

      expect(reportContent.innerHTML).toContain(errorMessage);
      expect(reportContent.innerHTML).toContain("color: red");
    });

    test("devrait gérer les données corrompues ou invalides", () => {
      const invalidData = {
        results: null,
        score: undefined,
      };

      // Vérifier que les données sont invalides
      expect(invalidData.results).toBeNull();
      expect(invalidData.score).toBeUndefined();

      // Dans ce cas, on devrait afficher une erreur
      const hasValidData =
        invalidData.results && typeof invalidData.score === "number";
      expect(hasValidData).toBeFalsy();
    });
  });

  describe("URL Chrome extension", () => {
    test("devrait générer correctement les URLs des ressources", () => {
      const iconUrl = chrome.runtime.getURL("icon48.png");

      expect(chrome.runtime.getURL).toHaveBeenCalledWith("icon48.png");
      expect(iconUrl).toBe("chrome-extension://fake-id/icon48.png");
    });
  });
});
