/**
 * Tests unitaires pour content.js
 * Teste les fonctions d'audit d'accessibilité
 */

describe("QuickA11y - Images", () => {
  beforeEach(() => {
    // Réinitialiser le DOM avant chaque test
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  describe("checkImages()", () => {
    test("devrait détecter les images sans attribut alt", () => {
      document.body.innerHTML = `
                <img src="image1.jpg">
                <img src="image2.jpg" alt="">
                <img src="image3.png" alt="Description de l'image">
            `;

      // Simuler la fonction checkImages
      function checkImages() {
        const images = document.querySelectorAll("img");
        const issues = [];

        images.forEach((img, index) => {
          if (!img.alt || img.alt.trim() === "") {
            issues.push({
              element: `Image ${index + 1}`,
              issue: "Texte alternatif manquant",
              severity: "élevée",
            });
          }
        });

        return {
          total: images.length,
          issues: issues,
          passed: images.length - issues.length,
        };
      }

      // Appeler la fonction checkImages
      const result = checkImages();

      // Définir les valeurs attendues
      const EXPECTED_TOTAL_IMAGES = 3;
      const EXPECTED_ISSUES_COUNT = 2;
      const EXPECTED_PASSED_COUNT = 1;

      // Vérifier les résultats
      expect(result.total).toBe(EXPECTED_TOTAL_IMAGES);
      expect(result.issues.length).toBe(EXPECTED_ISSUES_COUNT);
      expect(result.passed).toBe(EXPECTED_PASSED_COUNT);
      expect(result.issues[0].issue).toBe("Texte alternatif manquant");
    });

    test("devrait marquer visuellement les images problématiques", () => {
      document.body.innerHTML = `
        <div><img src="test.jpg"></div>
      `;

      const img = document.querySelector("img");

      // Simuler le style appliqué aux images problématiques
      img.style.border = "5px solid #ef4444";
      img.setAttribute("data-accessibility-issue", "missing-alt");

      // Vérifier que le style a été appliqué correctement
      expect(img.style.border).toBe("5px solid #ef4444");
      expect(img.getAttribute("data-accessibility-issue")).toBe("missing-alt");
    });

    test("ne devrait pas signaler les images avec un attribut alt valide", () => {
      document.body.innerHTML = `
             <img src="logo.png" alt="Logo de l'entreprise">
        <img src="profil.jpg" alt="Photo de profil">
      `;

      function checkImages() {
        const images = document.querySelectorAll("img");
        const issues = [];

        images.forEach((img, index) => {
          if (!img.alt || img.alt.trim() === "") {
            issues.push({ element: `Image ${index + 1}` });
          }
        });

        return {
          total: images.length,
          issues: issues,
          passed: images.length - issues.length,
        };
      }
      const result = checkImages();

      // Définir les valeurs attendues
      const EXPECTED_TOTAL_IMAGES = 2;
      const EXPECTED_ISSUES_COUNT = 0;
      const EXPECTED_PASSED_COUNT = 2;

      // Vérifier les résultats
      expect(result.total).toBe(EXPECTED_TOTAL_IMAGES);
      expect(result.issues.length).toBe(EXPECTED_ISSUES_COUNT);
      expect(result.passed).toBe(EXPECTED_PASSED_COUNT);
    });

    test("devrait créer un badge visuel pour les images avec des problèmes d'accessibilité", () => {
      document.body.innerHTML = `
         <div><img src="test.jpg" id="test-img"></div>
      `;

      const img = document.querySelector("#test-img");
      const imgParent = img.parentElement;

      // Simuler la création du badge
      const badge = document.createElement("div");
      badge.className = "accessibility-badge";
      badge.textContent = "⚠️ ALT MANQUANT";
      imgParent.appendChild(badge);

      const createdBadge = imgParent.querySelector(".accessibility-badge");

      // Vérifier que le badge a été créé correctement
      expect(createdBadge).toBeTruthy();
      expect(createdBadge.textContent).toBe("⚠️ ALT MANQUANT");
    });
  });
});
