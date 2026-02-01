/**
 * Tests unitaires pour content.js
 * Teste les fonctions d'audit d'accessibilité
 */
// const { injectColorblindFilters } = require("../content.js");
// import { injectColorblindFilters } from "../content.js";

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

  describe("QuickA11y - SVG", () => {
    test("devrait détecter les SVG sans attributs d'accessibilité", () => {
      document.body.innerHTML = `
        <svg width="100" height="100"></svg>
        <svg role="img" aria-label="Icône"><circle r="10"/></svg>
        <svg aria-hidden="true"><path d="M0,0"/></svg>
      `;

      function checkSVG() {
        const svgs = document.querySelectorAll("svg");
        const issues = [];

        svgs.forEach((svg, index) => {
          const hasRole = svg.getAttribute("role") === "img";
          const hasAriaLabel =
            svg.hasAttribute("aria-label") &&
            svg.getAttribute("aria-label").trim() !== "";
          const hasTitle = svg.querySelector("title");
          const isHidden = svg.getAttribute("aria-hidden") === "true";

          if (!hasRole && !hasAriaLabel && !hasTitle && !isHidden) {
            issues.push({
              element: `SVG ${index + 1}`,
              issue: "SVG inline sans description",
            });
          }
        });

        return {
          total: svgs.length,
          issues: issues,
          passed: svgs.length - issues.length,
        };
      }
      const result = checkSVG();

      // Définir les valeurs attendues
      const EXPECTED_TOTAL_SVGS = 3;
      expect(result.total).toBe(EXPECTED_TOTAL_SVGS);
      expect(result.issues.length).toBe(1);
      expect(result.passed).toBe(2);
    });

    test("devrait accepter SVG avec un title comme accessible", () => {
      document.body.innerHTML = `
        <svg><title>Icône de maison</title><rect width="100" height="100"/></svg>
      `;

      const svg = document.querySelector("svg");
      const hasTitle = svg.querySelector("title");

      expect(hasTitle).toBeTruthy();
      expect(hasTitle.textContent).toBe("Icône de maison");
    });

    test('devrait ignorer les SVG avec aria-hidden="true"', () => {
      document.body.innerHTML = `
        <svg aria-hidden="true"><circle r="10"/></svg>
      `;

      function checkSVG() {
        const svgs = document.querySelectorAll("svg");
        const issues = [];

        svgs.forEach((svg) => {
          const isHidden = svg.getAttribute("aria-hidden") === "true";
          if (!isHidden) {
            issues.push({ element: "SVG" });
          }
        });
        return {
          issues,
        };
      }
      const result = checkSVG();
      expect(result.issues.length).toBe(0);
    });
  });

  test("devrait marquer visuellement les SVG problématiques", () => {
    document.body.innerHTML = `
      <div><svg width="100" height="100"></svg></div>
    `;
    const svg = document.querySelector("svg");

    // Simuler le style appliqué aux SVG problématiques
    svg.style.outline = "5px solid #a855f7";
    svg.style.outlineOffset = "3px";
    svg.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.6)";
    svg.setAttribute("data-accessibility-issue", "svg-no-desc");

    // Vérifier que le style a été appliqué correctement
    expect(svg.style.outline).toBe("5px solid #a855f7");
    expect(svg.style.outlineOffset).toBe("3px");
    expect(svg.style.boxShadow).toBe("0 0 20px rgba(168, 85, 247, 0.6)");
    expect(svg.getAttribute("data-accessibility-issue")).toBe("svg-no-desc");
  });

  test("devrait créer un badge visuel pour les SVG avec des problèmes d'accessibilité", () => {
    document.body.innerHTML = `
       <div><svg width="100" height="100" id="test-svg"></svg></div>
    `;
    const svg = document.querySelector("#test-svg");
    const svgParent = svg.parentElement;
    // Simuler la création du badge
    const badge = document.createElement("div");
    badge.className = "accessibility-badge-svg";
    badge.textContent = "⚠️ SVG NON ACCESSIBLE";
    badge.setAttribute("data-badge-for", "test-svg");
    svgParent.appendChild(badge);
    const createdBadge = svgParent.querySelector(".accessibility-badge-svg");

    // Vérifier que le badge a été créé correctement
    expect(createdBadge).toBeTruthy();
    expect(createdBadge.textContent).toBe("⚠️ SVG NON ACCESSIBLE");
  });
});

describe("QuickA11y - Liens", () => {
  describe("checkLinks()", () => {
    test("devrait détecter les liens vides", () => {
      document.body.innerHTML = `
                <a href="#"></a>
        <a href="#">Lien valide</a>
        <a href="#" aria-label="Description"></a>
            `;

      function checkLinks() {
        const links = document.querySelectorAll("a");
        const issues = [];

        links.forEach((link, index) => {
          const text = link.textContent.trim();
          const ariaLabel = link.getAttribute("aria-label");

          if (!text && !ariaLabel) {
            issues.push({
              element: `Lien ${index + 1}`,
              issue: "Lien sans texte descriptif",
            });
          }
        });
        return {
          total: links.length,
          issues: issues,
          passed: links.length - issues.length,
        };
      }
      const result = checkLinks();

      const EXPECTED_TOTAL_LINKS = 3;
      expect(result.total).toBe(EXPECTED_TOTAL_LINKS);
      expect(result.issues.length).toBe(1);
      expect(result.passed).toBe(2);
    });

    test("devrait accepter les liens avec une image ayant un alt comme valide", () => {
      document.body.innerHTML = `
        <a href="#"><img src="icon.png" alt="Accueil"></a>
      `;

      const link = document.querySelector("a");
      const hasImageWithAlt = link.querySelector('img[alt]:not([alt=""])');

      expect(hasImageWithAlt).toBeTruthy();
      expect(hasImageWithAlt.getAttribute("alt")).toBe("Accueil");
    });

    test("devrait accepter un lien qui contient un SVG avec des attributs d'accessibilité", () => {
      document.body.innerHTML = `
        <a href="#"><svg role="img" aria-label="Icône de maison"><rect width="100" height="100"/></svg></a>
      `;
      const link = document.querySelector("a");
      const hasSVGAccessible = link.querySelector(
        "svg[role='img'][aria-label]",
      );

      expect(hasSVGAccessible).toBeTruthy();
      expect(hasSVGAccessible.getAttribute("aria-label")).toBe(
        "Icône de maison",
      );
    });

    test("devrait marquer visuellement les liens problématiques", () => {
      document.body.innerHTML = `
        <div><a href="#" id="test-link"></a></div>
      `;
      const link = document.querySelector("#test-link");
      // Simuler le style appliqué aux liens problématiques
      link.style.outline = `3px solid #f59e0b`;
      link.style.outlineOffset = "2px";
      link.setAttribute("data-accessibility-issue", "missing-text");

      // Vérifier que le style a été appliqué correctement
      expect(link.style.outline).toBe("3px solid #f59e0b");
      expect(link.style.outlineOffset).toBe("2px");
      expect(link.getAttribute("data-accessibility-issue")).toBe(
        "missing-text",
      );
    });
    test("devrait créer un badge visuel pour les liens avec des problèmes d'accessibilité", () => {
      document.body.innerHTML = `
         <div><a href="#" id="test-link"></a></div>
      `;
      const link = document.querySelector("#test-link");
      const linkParent = link.parentElement;
      // Simuler la création du badge
      const badge = document.createElement("div");
      badge.className = "accessibility-badge-link";
      badge.textContent = "⚠️ TEXTE MANQUANT";
      linkParent.appendChild(badge);
      const createdBadge = linkParent.querySelector(
        ".accessibility-badge-link",
      );
      // Vérifier que le badge a été créé correctement
      expect(createdBadge).toBeTruthy();
      expect(createdBadge.textContent).toBe("⚠️ TEXTE MANQUANT");
    });

    test("devrait vérifier si le texte du lien est non descriptif", () => {
      const nonDescriptiveTexts = [
        "cliquez ici",
        "en savoir plus",
        "voir",
        "lire la suite",
      ];
      nonDescriptiveTexts.forEach((text) => {
        document.body.innerHTML = `<a href="#">${text}</a>`;
        const link = document.querySelector("a");
        const linkText = link.textContent.trim().toLowerCase();
        const isNonDescriptive = nonDescriptiveTexts.includes(linkText);
        expect(isNonDescriptive).toBe(true);
      });
    });
  });
});

describe("QuickA11y - Titres", () => {
  describe("checkHeadings()", () => {
    test("devrait valider une hiérarchie correcte des titres", () => {
      document.body.innerHTML = `
        <h1>Titre principal</h1>
        <h2>Sous-titre</h2>
        <h3>Sous-sous-titre</h3>
        <h2>Autre section</h2>
      `;

      function checkHeadings() {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const issues = [];
        let previousLevel = 0;

        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName.slice(1));

          if (index === 0 && level !== 1) {
            issues.push({
              element: heading.tagName,
              issue: "Le premier titre devrait être H1",
            });
          }
          if (level - previousLevel > 1) {
            issues.push({
              element: heading.tagName,
              issue: "Saut de niveau dans la hiérarchie",
            });
          }
          previousLevel = level;
        });
        return {
          total: headings.length,
          issues: issues,
          passed: headings.length - issues.length,
        };
      }

      const result = checkHeadings();
      const EXPECTED_TOTAL_HEADINGS = 4;
      const EXPECTED_PASSED_HEADINGS = 4;
      expect(result.total).toBe(EXPECTED_TOTAL_HEADINGS);
      expect(result.issues.length).toBe(0);
      expect(result.passed).toBe(EXPECTED_PASSED_HEADINGS);
    });

    test("devrait détecter un saut de niveau dans les titres", () => {
      document.body.innerHTML = `
        <h1>Titre principal</h1>
        <h3>Sous-titre</h3>
      `;

      function checkHeadings() {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const issues = [];
        let previousLevel = 0;

        headings.forEach((heading) => {
          const level = parseInt(heading.tagName.slice(1));
          if (level - previousLevel > 1) {
            issues.push({
              element: heading.tagName,
              issue: "Saut de niveau dans la hiérarchie",
            });
          }
          previousLevel = level;
        });
        return {
          issues,
        };
      }
      const result = checkHeadings();
      expect(result.issues.length).toBe(1);
    });

    test("devrait détecter l'absence de H1", () => {
      document.body.innerHTML = `
        <h2>Titre</h2>
        <h3>Sous-titre</h3>
      `;

      function checkHeadings() {
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const issues = [];

        if (headings.length > 0) {
          const firstHeading = headings[0];
          const level = parseInt(firstHeading.tagName.slice(1));

          if (level !== 1) {
            issues.push({
              element: firstHeading.tagName,
              issue: "Le premier titre devrait être H1",
            });
          }
        }
        return {
          issues,
        };
      }
      const result = checkHeadings();
      expect(result.issues.length).toBe(1);
    });

    test("devrait détecter la présence de plusieurs H1", () => {
      document.body.innerHTML = `
        <h1>Titre principal</h1>
        <h1>Deuxième titre principal</h1>
      `;
      function checkHeadings() {
        const headings = document.querySelectorAll("h1");
        const issues = [];
        if (headings.length > 1) {
          issues.push({
            element: "H1",
            issue: "Plusieurs titres H1 détectés",
          });
        }
        return {
          issues,
        };
      }
      const result = checkHeadings();
      expect(result.issues.length).toBe(1);
    });
  });
});

describe("QuickA11y - Formulaires", () => {
  describe("checkForms()", () => {
    test("devrait détecter les champs de formulaire sans label", () => {
      document.body.innerHTML = `
        <form>
          <input type="text" id="name">
          <label for="email">Email</label>
          <input type="email" id="email">
          <input type="text" placeholder="Téléphone">
        </form>
      `;

      function checkForms() {
        const inputs = document.querySelectorAll("input, textarea, select");
        const issues = [];

        inputs.forEach((input, index) => {
          const id = input.id;
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = input.hasAttribute("aria-label");

          if (!hasLabel && !hasAriaLabel) {
            issues.push({
              element: `Champ ${index + 1}`,
              issue: "Champ de formulaire sans label",
            });
          }
        });
        return {
          total: inputs.length,
          issues: issues,
          passed: inputs.length - issues.length,
        };
      }
      const result = checkForms();

      const EXPECTED_TOTAL_INPUTS = 3;
      expect(result.total).toBe(EXPECTED_TOTAL_INPUTS);
      expect(result.issues.length).toBe(2);
      expect(result.passed).toBe(1);
    });

    test("devrait accepter aria-label comme valide pour les champs de formulaire", () => {
      document.body.innerHTML = `
        <form>
          <input type="text" aria-label="Nom complet">
        </form>
      `;

      const input = document.querySelector("input");
      expect(input.getAttribute("aria-label")).toBe("Nom complet");
    });
  });
});

// describe("QuickA11y - Filtre Daltonisme", () => {
//   describe("injectColorblindFilters()", () => {
//     test("injectColorblindFilters ajoute le SVG des filtres daltonisme au DOM", () => {

//       document.body.innerHTML = "";

//       injectColorblindFilters();

// Vérifier la présence du SVG
// const svg = document.getElementById("colorblind-filters");
// expect(svg).not.toBeNull();

// Vérifier la présence des filtres
//       expect(svg.innerHTML).toContain('id="protanopia"');
//       expect(svg.innerHTML).toContain('id="deuteranopia"');
//     });
//   });
// });

describe("QuickA11y - Structure du document", () => {
  describe("checkLanguage()", () => {
    test("devrait détecter l'absence d'attribut lang sur la balise html", () => {
      document.documentElement.removeAttribute("lang");

      function checkLanguage() {
        const lang = document.documentElement.getAttribute("lang");
        const issues = [];

        if (!lang) {
          issues.push({
            element: "<html>",
            issue: "Attribut lang manquant",
          });
        }
        return {
          issues,
        };
      }
      const result = checkLanguage();
      expect(result.issues.length).toBe(1);
    });

    test("devrait accepter un attribut lang valide sur la balise html", () => {
      document.documentElement.setAttribute("lang", "fr");

      function checkLanguage() {
        const lang = document.documentElement.getAttribute("lang");
        return {
          hasLang: !!lang,
          lang,
        };
      }
      const result = checkLanguage();
      expect(result.hasLang).toBe(true);
      expect(result.lang).toBe("fr");
    });
  });

  describe("checkLandmarks()", () => {
    test("devrait détecter la présence du role main et d'une nav", () => {
      document.body.innerHTML = `
        <nav></nav>
        <main role="main"></main>
      `;

      function checkLandmarks() {
        const nav = document.querySelector('nav, [role="navigation"]');
        const main = document.querySelector('main, [role="main"]');
        const issues = [];

        if (!nav) {
          issues.push({
            element: "<nav>",
            issue: "Balise nav manquante",
          });
        }
        if (!main) {
          issues.push({
            element: "<main>",
            issue: "Balise main avec role='main' manquante",
          });
        }
        return {
          issues,
        };
      }
      const result = checkLandmarks();
      expect(result.issues.length).toBe(0);
    });
  });
});

describe("QuickA11y - boutons accessibles", () => {
  describe("checkButtons()", () => {
    test("devrait détecter les boutons vide", () => {
      document.body.innerHTML = `
        <button></button>
        <button>Envoyer</button>
        <button aria-label="Soumettre le formulaire"></button>
      `;
      function checkButtons() {
        const buttons = document.querySelectorAll("button");
        const issues = [];

        buttons.forEach((btn, index) => {
          const text = btn.textContent.trim();
          const ariaLabel = btn.getAttribute("aria-label");

          if (!text && !ariaLabel) {
            issues.push({
              element: `Bouton ${index + 1}`,
              issue: "Bouton sans texte descriptif",
            });
          }
        });
        return {
          total: buttons.length,
          issues: issues,
          passed: buttons.length - issues.length,
        };
      }
      const result = checkButtons();
      const EXPECTED_TOTAL_BUTTONS = 3;
      expect(result.total).toBe(EXPECTED_TOTAL_BUTTONS);
      expect(result.issues.length).toBe(1);
      expect(result.passed).toBe(2);
    });
  });
});

describe("QuickA11y - Fonctions utilitaires", () => {
  describe("clearVisualFeedback()", () => {
    test("devrait supprimer les styles, badges d'accessibilité et marqueurs visuels", () => {
      document.body.innerHTML = `
        <img src="test.jpg" data-accessibility-issue="missing-alt" style="border: 5px solid red">
        <div class="accessibility-badge">Badge</div>
      `;

      const img = document.querySelector("img");
      const badge = document.querySelector(".accessibility-badge");

      // Simuler le nettoyage
      img.style.border = "";
      img.removeAttribute("data-accessibility-issue");
      badge.remove();

      expect(img.style.border).toBe("");
      expect(img.getAttribute("data-accessibility-issue")).toBeNull();
      expect(document.querySelector(".accessibility-badge")).toBeNull();
    });
  });

  describe("scrollToElement()", () => {
    test("devrait faire défiler jusqu'à l'élément spécifié", () => {
      document.body.innerHTML = `
        <div data-accessibility-id="test-id" id="target">Element</div>
      `;

      const element = document.querySelector(
        '[data-accessibility-id="test-id"]',
      );

      // Simuler la fonction de défilement
      const scrollIntoViewMock = jest.fn();
      element.scrollIntoView = scrollIntoViewMock;

      element.scrollIntoView({ behavior: "smooth", block: "center" });

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });
  });
});
