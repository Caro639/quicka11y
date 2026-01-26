// Content script pour analyser l'accessibilité de la page

// Stocker les éléments marqués pour pouvoir les modifier plus tard
const markedElements = {
  images: [],
  svgs: [],
  links: [],
  headings: [],
  forms: [],
  buttons: [],
};

// Fonction principale d'audit
function auditAccessibility() {
  // Réinitialiser les tableaux
  markedElements.images = [];
  markedElements.svgs = [];
  markedElements.links = [];
  markedElements.headings = [];
  markedElements.forms = [];
  markedElements.buttons = [];

  const results = {
    images: checkImages(),
    svg: checkSVG(),
    links: checkLinks(),
    headings: checkHeadings(),
    forms: checkForms(),
    colorblind: { total: 0, issues: [], passed: 0 },
    lang: checkLanguage(),
    landmarks: checkLandmarks(),
    buttons: checkButtons(),
  };

  return results;
}

// Vérifier les images sans texte alternatif
function checkImages() {
  const images = document.querySelectorAll("img");
  const issues = [];

  images.forEach((img, index) => {
    if (!img.alt || img.alt.trim() === "") {
      // Ajouter un ID unique pour la navigation
      const imageId = `accessibility-img-${index}`;
      img.setAttribute("data-accessibility-id", imageId);

      // Ajouter une bordure rouge plus visible avec animation
      img.style.border = "5px solid #ef4444";
      img.style.outline = "5px solid #cc0808";
      img.style.outlineOffset = "3px";
      img.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.6)";
      img.style.animation = "pulse-red 2s infinite";
      img.setAttribute("data-accessibility-issue", "missing-alt");

      // Stocker l'élément pour pouvoir le modifier plus tard
      markedElements.images.push(img);

      // Créer et ajouter un badge visuel
      if (!img.parentElement.querySelector(".accessibility-badge")) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge";
        badge.textContent = "⚠️ ALT MANQUANT";
        badge.setAttribute("data-badge-for", imageId);

        // Positionner le badge
        const imgParent = img.parentElement;
        const originalPosition = window.getComputedStyle(imgParent).position;
        if (originalPosition === "static") {
          imgParent.style.position = "relative";
          imgParent.setAttribute("data-position-changed", "true");
        }

        imgParent.appendChild(badge);
      }

      // Ajouter l'animation CSS si elle n'existe pas déjà
      if (!document.getElementById("accessibility-animation-styles")) {
        const style = document.createElement("style");
        style.id = "accessibility-animation-styles";
        style.textContent = `
          @keyframes pulse-red {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .accessibility-badge {
            position: absolute;
            top: 5px;
            left: 5px;
            background: #dc2626;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 999999;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            animation: pulse-red 2s infinite;
          }
          
          .accessibility-badge-link {
            position: absolute;
            top: 0;
            left: 0;
            background: #f97316;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 999999;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            animation: pulse-red 2s infinite;
            white-space: nowrap;
          }
          
          .accessibility-badge-svg {
            position: absolute;
            top: 5px;
            left: 5px;
            background: #a855f7;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 999999;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            animation: pulse-red 2s infinite;
            white-space: nowrap;
          }
        `;
        document.head.appendChild(style);
      }
      issues.push({
        element: `Image ${index + 1}`,
        issue: "Texte alternatif manquant",
        explanation:
          "Sans attribut alt, un utilisateur non-voyant ne peut pas comprendre cette image !",
        severity: "élevée",
        src: img.src,
        imageId: imageId,
      });
    } else {
      // Retirer le style si l'image a un alt valide
      if (img.getAttribute("data-accessibility-issue") === "missing-alt") {
        img.style.border = "";
        img.style.outline = "";
        img.style.outlineOffset = "";
        img.style.boxShadow = "";
        img.style.animation = "";
        img.removeAttribute("data-accessibility-issue");
        img.removeAttribute("data-accessibility-id");

        // Retirer le badge
        const badge = img.parentElement.querySelector(".accessibility-badge");
        if (badge) {
          badge.remove();
        }

        // Restaurer la position du parent si elle a été changée
        if (
          img.parentElement.getAttribute("data-position-changed") === "true"
        ) {
          img.parentElement.style.position = "";
          img.parentElement.removeAttribute("data-position-changed");
        }
      }
    }
  });

  return {
    total: images.length,
    issues: issues,
    passed: images.length - issues.length,
  };
}

// Vérifier les SVG inline sans attributs d'accessibilité
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

    // Si le SVG n'a aucun attribut d'accessibilité et n'est pas caché
    if (!hasRole && !hasAriaLabel && !hasTitle && !isHidden) {
      // Ajouter un ID unique pour la navigation
      const svgId = `accessibility-svg-${index}`;
      svg.setAttribute("data-accessibility-id", svgId);

      // Ajouter un style visuel (bordure violette)
      svg.style.outline = "5px solid #a855f7";
      svg.style.outlineOffset = "3px";
      svg.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.6)";
      svg.setAttribute("data-accessibility-issue", "svg-no-desc");

      // Stocker l'élément
      markedElements.svgs.push(svg);

      // Créer et ajouter un badge visuel violet
      if (
        !svg.parentElement.querySelector(
          `.accessibility-badge-svg[data-badge-for="${svgId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-svg";
        badge.textContent = "⚠️ SVG NON ACCESSIBLE";
        badge.setAttribute("data-badge-for", svgId);

        // Positionner le badge
        const svgParent = svg.parentElement;
        const originalPosition = window.getComputedStyle(svgParent).position;
        if (originalPosition === "static") {
          svgParent.style.position = "relative";
          svgParent.setAttribute("data-position-changed", "true");
        }

        svgParent.appendChild(badge);
      }

      issues.push({
        element: `SVG ${index + 1}`,
        issue: "SVG inline sans description",
        explanation:
          'Ajoutez role="img" + aria-label, ou un élément title interne, ou aria-hidden="true" si décoratif',
        severity: "élevée",
        svgId: svgId,
      });
    } else {
      // Retirer le style si le SVG est valide
      if (svg.getAttribute("data-accessibility-issue") === "svg-no-desc") {
        svg.style.outline = "";
        svg.style.outlineOffset = "";
        svg.style.boxShadow = "";
        svg.removeAttribute("data-accessibility-issue");
        svg.removeAttribute("data-accessibility-id");

        // Retirer le badge
        const badge = svg.parentElement.querySelector(
          ".accessibility-badge-svg",
        );
        if (badge) {
          badge.remove();
        }

        // Restaurer la position du parent si elle a été changée
        if (
          svg.parentElement.getAttribute("data-position-changed") === "true"
        ) {
          svg.parentElement.style.position = "";
          svg.parentElement.removeAttribute("data-position-changed");
        }
      }
    }
  });

  return {
    total: svgs.length,
    issues: issues,
    passed: svgs.length - issues.length,
  };
}

// Vérifier les liens
function checkLinks() {
  const links = document.querySelectorAll("a");
  const issues = [];

  links.forEach((link, index) => {
    const ariaLabel = link.getAttribute("aria-label");

    // Vérifier si le lien contient une image avec alt
    const hasImageWithAlt = link.querySelector('img[alt]:not([alt=""])');

    // Vérifier si le lien contient un SVG accessible
    const svgInLink = link.querySelector("svg");
    let hasSVGAccessible = false;
    if (svgInLink) {
      const hasRole = svgInLink.getAttribute("role") === "img";
      const hasSvgAriaLabel =
        svgInLink.hasAttribute("aria-label") &&
        svgInLink.getAttribute("aria-label").trim() !== "";
      const hasTitle = svgInLink.querySelector("title");
      hasSVGAccessible = hasRole || hasSvgAriaLabel || hasTitle;
    }

    // Obtenir le texte réel (sans le contenu des SVG, images et badges d'accessibilité)
    const linkClone = link.cloneNode(true);
    linkClone
      .querySelectorAll(
        "svg, img, .accessibility-badge, .accessibility-badge-link, .accessibility-badge-svg",
      )
      .forEach((el) => el.remove());
    const text = linkClone.textContent.trim();

    // Le lien est problématique si il n'a pas de description accessible
    const hasAccessibleDescription =
      text || ariaLabel || hasImageWithAlt || hasSVGAccessible;

    if (!hasAccessibleDescription) {
      // Ajouter un ID unique pour la navigation
      const linkId = `accessibility-link-${index}`;
      link.setAttribute("data-accessibility-id", linkId);

      // Ajouter un style visuel (bordure orange)
      link.style.outline = "3px solid #f97316";
      link.style.outlineOffset = "2px";
      link.setAttribute("data-accessibility-issue", "missing-text");

      // Stocker l'élément
      markedElements.links.push(link);

      // Créer et ajouter un badge visuel orange
      if (
        !link.parentElement.querySelector(
          `.accessibility-badge-link[data-badge-for="${linkId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-link";
        badge.textContent = "⚠️ LIEN VIDE";
        badge.setAttribute("data-badge-for", linkId);

        // Positionner le badge
        const linkParent = link.parentElement;
        const originalPosition = window.getComputedStyle(linkParent).position;
        if (originalPosition === "static") {
          linkParent.style.position = "relative";
          linkParent.setAttribute("data-position-changed", "true");
        }

        linkParent.appendChild(badge);
      }

      issues.push({
        element: `Lien ${index + 1}`,
        issue: "Lien sans texte descriptif",
        explanation:
          "Sans texte, un utilisateur non-voyant ne sait pas où mène ce lien !",
        severity: "élevée",
        href: link.href,
        linkId: linkId,
      });
    } else if (
      text.toLowerCase() === "cliquez ici" ||
      text.toLowerCase() === "en savoir plus" ||
      text.toLowerCase() === "voir" ||
      text.toLowerCase() === "lire la suite"
    ) {
      // Si le lien a un aria-label, c'est OK !
      if (!ariaLabel) {
        // Ajouter un ID unique pour la navigation
        const linkId = `accessibility-link-${index}`;
        link.setAttribute("data-accessibility-id", linkId);

        // Style visuel pour texte non descriptif (bordure jaune)
        link.style.outline = "3px solid #fbbf24";
        link.style.outlineOffset = "2px";
        link.setAttribute("data-accessibility-issue", "bad-text");

        // Stocker l'élément
        markedElements.links.push(link);

        // Créer et ajouter un badge visuel jaune
        if (
          !link.parentElement.querySelector(
            `.accessibility-badge-link[data-badge-for="${linkId}"]`,
          )
        ) {
          const badge = document.createElement("div");
          badge.className = "accessibility-badge-link";
          badge.textContent = "⚠️ ARIA-LABEL ?";
          badge.setAttribute("data-badge-for", linkId);
          badge.style.background = "#f59e0b"; // Jaune/orange

          // Positionner le badge
          const linkParent = link.parentElement;
          const originalPosition = window.getComputedStyle(linkParent).position;
          if (originalPosition === "static") {
            linkParent.style.position = "relative";
            linkParent.setAttribute("data-position-changed", "true");
          }

          linkParent.appendChild(badge);
        }

        issues.push({
          element: `Lien ${index + 1}`,
          issue: "Texte de lien non descriptif",
          explanation:
            "Ajoutez un aria-label pour décrire la destination (ex: aria-label='En savoir plus sur [sujet]')",
          severity: "moyenne",
          text: text,
          linkId: linkId,
        });
      }
    } else {
      // Retirer les styles si le lien est valide
      if (link.getAttribute("data-accessibility-issue")) {
        link.style.outline = "";
        link.style.outlineOffset = "";
        link.removeAttribute("data-accessibility-issue");
        link.removeAttribute("data-accessibility-id");

        // Retirer le badge du lien
        const linkId = link.getAttribute("data-accessibility-id");
        const badge = link.parentElement.querySelector(
          `.accessibility-badge-link[data-badge-for="${linkId}"]`,
        );
        if (badge) {
          badge.remove();
        }

        // Restaurer la position du parent si elle a été changée
        if (
          link.parentElement.getAttribute("data-position-changed") === "true"
        ) {
          link.parentElement.style.position = "";
          link.parentElement.removeAttribute("data-position-changed");
        }
      }
    }
  });

  return {
    total: links.length,
    issues: issues,
    passed: links.length - issues.length,
  };
}

// Vérifier la structure des titres
function checkHeadings() {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const issues = [];
  let previousLevel = 0;
  let issueIndex = 0;

  // Injecter les styles CSS pour les badges de titres (une seule fois)
  if (!document.getElementById("accessibility-heading-styles")) {
    const style = document.createElement("style");
    style.id = "accessibility-heading-styles";
    style.textContent = `
      .accessibility-badge-heading {
        position: absolute;
        top: -8px;
        left: 0;
        background: #3b82f6;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        animation: pulse-red 2s infinite;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  // Vérifier s'il y a un H1
  const h1Count = document.querySelectorAll("h1").length;
  if (h1Count === 0) {
    issues.push({
      element: "Structure",
      issue: "Aucun titre H1 trouvé sur la page",
      severity: "élevée",
    });
  } else if (h1Count > 1) {
    issues.push({
      element: "Structure",
      issue: `${h1Count} titres H1 trouvés (recommandé: 1 seul)`,
      severity: "moyenne",
    });
  }

  // Vérifier la hiérarchie
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));

    if (previousLevel > 0 && level - previousLevel > 1) {
      // Ajouter un ID unique pour la navigation
      const headingId = `accessibility-heading-${issueIndex}`;
      heading.setAttribute("data-accessibility-id", headingId);

      // Ajouter un style visuel (bordure bleue)
      heading.style.outline = "4px solid #3b82f6";
      heading.style.outlineOffset = "2px";
      heading.setAttribute("data-accessibility-issue", "heading-skip");

      // Stocker l'élément
      markedElements.headings.push(heading);

      // Créer et ajouter un badge visuel bleu
      if (
        !heading.parentElement.querySelector(
          `.accessibility-badge-heading[data-badge-for="${headingId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-heading";
        badge.textContent = `⚠️ SAUT H${previousLevel}→H${level}`;
        badge.setAttribute("data-badge-for", headingId);

        // Positionner le badge
        const originalPosition = window.getComputedStyle(
          heading.parentElement,
        ).position;
        if (originalPosition === "static") {
          heading.parentElement.style.position = "relative";
          heading.parentElement.setAttribute("data-position-changed", "true");
        }

        heading.parentElement.appendChild(badge);
      }

      issues.push({
        element: `${heading.tagName}`,
        issue: `Saut de niveau de titre (de H${previousLevel} à H${level})`,
        severity: "moyenne",
        text: heading.textContent.trim(),
        headingId: headingId,
      });

      issueIndex++;
    }

    if (!heading.textContent.trim()) {
      // Ajouter un ID unique pour la navigation
      const headingId = `accessibility-heading-${issueIndex}`;
      heading.setAttribute("data-accessibility-id", headingId);

      // Ajouter un style visuel (bordure bleue)
      heading.style.outline = "4px solid #3b82f6";
      heading.style.outlineOffset = "2px";
      heading.setAttribute("data-accessibility-issue", "heading-empty");

      // Stocker l'élément
      markedElements.headings.push(heading);

      // Créer et ajouter un badge visuel bleu
      if (
        !heading.parentElement.querySelector(
          `.accessibility-badge-heading[data-badge-for="${headingId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-heading";
        badge.textContent = "⚠️ TITRE VIDE";
        badge.setAttribute("data-badge-for", headingId);

        // Positionner le badge
        const originalPosition = window.getComputedStyle(
          heading.parentElement,
        ).position;
        if (originalPosition === "static") {
          heading.parentElement.style.position = "relative";
          heading.parentElement.setAttribute("data-position-changed", "true");
        }

        heading.parentElement.appendChild(badge);
      }

      issues.push({
        element: `${heading.tagName} ${index + 1}`,
        issue: "Titre vide",
        severity: "élevée",
        headingId: headingId,
      });

      issueIndex++;
    }

    previousLevel = level;
  });

  return {
    total: headings.length,
    issues: issues,
    passed: headings.length - issues.length,
  };
}

// Vérifier les formulaires
function checkForms() {
  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
  );
  const issues = [];
  let issueIndex = 0;

  // Injecter les styles CSS pour les badges de formulaires (une seule fois)
  if (!document.getElementById("accessibility-form-styles")) {
    const style = document.createElement("style");
    style.id = "accessibility-form-styles";
    style.textContent = `
      .accessibility-badge-form {
        position: absolute;
        top: -8px;
        left: 0;
        background: #f59e0b;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        animation: pulse-red 2s infinite;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  inputs.forEach((input, index) => {
    const id = input.id;
    const label = id
      ? document.querySelector(`label[for="${id}"]`)
      : input.closest("label");
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledby = input.getAttribute("aria-labelledby");

    if (!label && !ariaLabel && !ariaLabelledby) {
      // Ajouter un ID unique pour la navigation
      const formId = `accessibility-form-${issueIndex}`;
      input.setAttribute("data-accessibility-id", formId);

      // Ajouter un style visuel (bordure orange)
      input.style.outline = "3px solid #f59e0b";
      input.style.outlineOffset = "2px";
      input.setAttribute("data-accessibility-issue", "form-no-label");

      // Stocker l'élément pour le filtrage
      markedElements.forms.push(input);

      // Créer et ajouter un badge visuel orange
      if (
        !input.parentElement.querySelector(
          `.accessibility-badge-form[data-badge-for="${formId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-form";
        badge.textContent = "⚠️ LABEL MANQUANT";
        badge.setAttribute("data-badge-for", formId);

        // Positionner le badge
        const originalPosition = window.getComputedStyle(
          input.parentElement,
        ).position;
        if (originalPosition === "static") {
          input.parentElement.style.position = "relative";
          input.parentElement.setAttribute("data-position-changed", "true");
        }

        input.parentElement.appendChild(badge);
      }

      issues.push({
        element: `${input.tagName} ${index + 1}`,
        issue: "Champ de formulaire sans étiquette",
        severity: "élevée",
        type: input.type || "text",
        formId: formId,
      });

      issueIndex++;
    }
  });

  return {
    total: inputs.length,
    issues: issues,
    passed: inputs.length - issues.length,
  };
}

// Fonction pour injecter les filtres SVG de daltonisme dans la page
function injectColorblindFilters() {
  // Vérifier si les filtres existent déjà
  if (document.getElementById("colorblind-filters")) {
    return;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "colorblind-filters";
  svg.style.position = "absolute";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.innerHTML = `
    <defs>
      <!-- Protanopie (perte du rouge) -->
      <filter id="protanopia">
        <feColorMatrix type="matrix" values="
          0.567, 0.433, 0,     0, 0
          0.558, 0.442, 0,     0, 0
          0,     0.242, 0.758, 0, 0
          0,     0,     0,     1, 0
        "/>
      </filter>
      
      <!-- Deutéranopie (perte du vert) -->
      <filter id="deuteranopia">
        <feColorMatrix type="matrix" values="
          0.625, 0.375, 0,   0, 0
          0.7,   0.3,   0,   0, 0
          0,     0.3,   0.7, 0, 0
          0,     0,     0,   1, 0
        "/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
}

// Fonction pour appliquer un filtre de daltonisme
function applyColorblindFilter(filterType) {
  injectColorblindFilters();

  if (filterType === "normal") {
    document.body.style.filter = "";
  } else if (filterType === "protanopia") {
    document.body.style.filter = "url(#protanopia)";
  } else if (filterType === "deuteranopia") {
    document.body.style.filter = "url(#deuteranopia)";
  }
}

// Vérifier l'attribut lang
function checkLanguage() {
  const issues = [];
  const htmlElement = document.querySelector("html");

  if (!htmlElement.hasAttribute("lang")) {
    issues.push({
      element: "HTML",
      issue: "Attribut lang manquant sur l'élément <html>",
      severity: "élevée",
    });
  }

  return {
    total: 1,
    issues: issues,
    passed: 1 - issues.length,
  };
}

// Vérifier les landmarks ARIA
function checkLandmarks() {
  const issues = [];

  const hasMain = document.querySelector('main, [role="main"]');
  const hasNav = document.querySelector('nav, [role="navigation"]');

  if (!hasMain) {
    issues.push({
      element: "Structure",
      issue: 'Aucun élément <main> ou role="main" trouvé',
      severity: "moyenne",
    });
  }

  if (!hasNav) {
    issues.push({
      element: "Structure",
      issue: 'Aucun élément <nav> ou role="navigation" trouvé',
      severity: "faible",
    });
  }

  return {
    total: 4,
    issues: issues,
    passed: 4 - issues.length,
  };
}

// Vérifier les boutons
function checkButtons() {
  const buttons = document.querySelectorAll("button");
  const issues = [];
  let issueIndex = 0;

  // Injecter les styles CSS pour les badges de boutons (une seule fois)
  if (!document.getElementById("accessibility-button-styles")) {
    const style = document.createElement("style");
    style.id = "accessibility-button-styles";
    style.textContent = `
      .accessibility-badge-button {
        position: absolute;
        top: -8px;
        left: 0;
        background: #10b981;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        animation: pulse-red 2s infinite;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  buttons.forEach((button, index) => {
    const text = button.textContent.trim();
    const ariaLabel = button.getAttribute("aria-label");

    if (!text && !ariaLabel) {
      // Ajouter un ID unique pour la navigation
      const buttonId = `accessibility-button-${issueIndex}`;
      button.setAttribute("data-accessibility-id", buttonId);

      // Ajouter un style visuel (bordure verte)
      button.style.outline = "4px solid #10b981";
      button.style.outlineOffset = "2px";
      button.setAttribute("data-accessibility-issue", "button-no-text");

      // Stocker l'élément pour le filtrage
      markedElements.buttons.push(button);

      // Créer et ajouter un badge visuel vert
      if (
        !button.parentElement.querySelector(
          `.accessibility-badge-button[data-badge-for="${buttonId}"]`,
        )
      ) {
        const badge = document.createElement("div");
        badge.className = "accessibility-badge-button";
        badge.textContent = "⚠️ TEXTE MANQUANT";
        badge.setAttribute("data-badge-for", buttonId);

        // Positionner le badge
        const originalPosition = window.getComputedStyle(
          button.parentElement,
        ).position;
        if (originalPosition === "static") {
          button.parentElement.style.position = "relative";
          button.parentElement.setAttribute("data-position-changed", "true");
        }

        button.parentElement.appendChild(badge);
      }

      issues.push({
        element: `Bouton ${index + 1}`,
        issue: "Bouton sans texte descriptif",
        severity: "élevée",
        buttonId: buttonId,
      });

      issueIndex++;
    }
  });

  return {
    total: buttons.length,
    issues: issues,
    passed: buttons.length - issues.length,
  };
}

// Fonction pour nettoyer tous les styles visuels d'accessibilité
function clearVisualFeedback() {
  const markedImages = document.querySelectorAll(
    '[data-accessibility-issue="missing-alt"]',
  );
  markedImages.forEach((img) => {
    img.style.border = "";
    img.style.outline = "";
    img.style.outlineOffset = "";
    img.style.boxShadow = "";
    img.style.animation = "";
    img.removeAttribute("data-accessibility-issue");
    img.removeAttribute("data-accessibility-id");

    // Retirer le badge
    const badge = img.parentElement.querySelector(".accessibility-badge");
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (img.parentElement.getAttribute("data-position-changed") === "true") {
      img.parentElement.style.position = "";
      img.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Nettoyer les liens marqués
  const markedLinks = document.querySelectorAll(
    '[data-accessibility-issue="missing-text"], [data-accessibility-issue="bad-text"]',
  );
  markedLinks.forEach((link) => {
    link.style.outline = "";
    link.style.outlineOffset = "";
    link.removeAttribute("data-accessibility-issue");
    link.removeAttribute("data-accessibility-id");

    // Retirer le badge du lien
    const badge = link.parentElement.querySelector(".accessibility-badge-link");
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (link.parentElement.getAttribute("data-position-changed") === "true") {
      link.parentElement.style.position = "";
      link.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Nettoyer les SVG marqués
  const markedSVGs = document.querySelectorAll(
    '[data-accessibility-issue="svg-no-desc"]',
  );
  markedSVGs.forEach((svg) => {
    svg.style.outline = "";
    svg.style.outlineOffset = "";
    svg.style.boxShadow = "";
    svg.removeAttribute("data-accessibility-issue");
    svg.removeAttribute("data-accessibility-id");

    // Retirer le badge du SVG
    const badge = svg.parentElement.querySelector(".accessibility-badge-svg");
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (svg.parentElement.getAttribute("data-position-changed") === "true") {
      svg.parentElement.style.position = "";
      svg.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Nettoyer les titres marqués
  const markedHeadings = document.querySelectorAll(
    '[data-accessibility-issue="heading-skip"], [data-accessibility-issue="heading-empty"]',
  );
  markedHeadings.forEach((heading) => {
    heading.style.outline = "";
    heading.style.outlineOffset = "";
    heading.removeAttribute("data-accessibility-issue");
    heading.removeAttribute("data-accessibility-id");

    // Retirer le badge du titre
    const badge = heading.parentElement.querySelector(
      ".accessibility-badge-heading",
    );
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (
      heading.parentElement.getAttribute("data-position-changed") === "true"
    ) {
      heading.parentElement.style.position = "";
      heading.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Nettoyer les formulaires marqués
  const markedForms = document.querySelectorAll(
    '[data-accessibility-issue="form-no-label"]',
  );
  markedForms.forEach((form) => {
    form.style.outline = "";
    form.style.outlineOffset = "";
    form.removeAttribute("data-accessibility-issue");
    form.removeAttribute("data-accessibility-id");

    // Retirer le badge du formulaire
    const badge = form.parentElement.querySelector(".accessibility-badge-form");
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (form.parentElement.getAttribute("data-position-changed") === "true") {
      form.parentElement.style.position = "";
      form.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Nettoyer les boutons marqués
  const markedButtons = document.querySelectorAll(
    '[data-accessibility-issue="button-no-text"]',
  );
  markedButtons.forEach((button) => {
    button.style.outline = "";
    button.style.outlineOffset = "";
    button.removeAttribute("data-accessibility-issue");
    button.removeAttribute("data-accessibility-id");

    // Retirer le badge du bouton
    const badge = button.parentElement.querySelector(
      ".accessibility-badge-button",
    );
    if (badge) {
      badge.remove();
    }

    // Restaurer la position du parent si elle a été changée
    if (button.parentElement.getAttribute("data-position-changed") === "true") {
      button.parentElement.style.position = "";
      button.parentElement.removeAttribute("data-position-changed");
    }
  });

  // Retirer tous les badges orphelins (au cas où)
  document.querySelectorAll(".accessibility-badge").forEach((badge) => {
    badge.remove();
  });
  document.querySelectorAll(".accessibility-badge-link").forEach((badge) => {
    badge.remove();
  });
  document.querySelectorAll(".accessibility-badge-svg").forEach((badge) => {
    badge.remove();
  });
  document.querySelectorAll(".accessibility-badge-heading").forEach((badge) => {
    badge.remove();
  });
  document.querySelectorAll(".accessibility-badge-form").forEach((badge) => {
    badge.remove();
  });
  document.querySelectorAll(".accessibility-badge-button").forEach((badge) => {
    badge.remove();
  });

  // Retirer les styles d'animation
  const animationStyles = document.getElementById(
    "accessibility-animation-styles",
  );
  if (animationStyles) {
    animationStyles.remove();
  }
}

// Fonction pour scroller vers une image spécifique
function scrollToImage(imageId) {
  const element = document.querySelector(
    `[data-accessibility-id="${imageId}"]`,
  );
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalBoxShadow = element.style.boxShadow;
    element.style.boxShadow = "0 0 30px rgba(239, 68, 68, 1)";
    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
    }, 1000);
  }
}

// Fonction pour scroller vers un lien spécifique
function scrollToLink(linkId) {
  const element = document.querySelector(`[data-accessibility-id="${linkId}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalOutline = element.style.outline;
    element.style.outline = "5px solid #f97316";
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1000);
  }
}

// Fonction pour scroller vers un SVG spécifique
function scrollToSVG(svgId) {
  const element = document.querySelector(`[data-accessibility-id="${svgId}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalOutline = element.style.outline;
    element.style.outline = "8px solid #a855f7";
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1000);
  }
}

// Fonction pour scroller vers un titre spécifique
function scrollToHeading(headingId) {
  const element = document.querySelector(
    `[data-accessibility-id="${headingId}"]`,
  );
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalOutline = element.style.outline;
    element.style.outline = "8px solid #3b82f6";
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1000);
  }
}

// Fonction pour scroller vers un formulaire spécifique
function scrollToForm(formId) {
  const element = document.querySelector(`[data-accessibility-id="${formId}"]`);
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalOutline = element.style.outline;
    element.style.outline = "6px solid #f59e0b";
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1000);
  }
}

// Fonction pour scroller vers un bouton spécifique
function scrollToButton(buttonId) {
  const element = document.querySelector(
    `[data-accessibility-id="${buttonId}"]`,
  );
  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Flash temporaire pour attirer l'attention
    const originalOutline = element.style.outline;
    element.style.outline = "6px solid #10b981";
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1000);
  }
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runAudit") {
    const results = auditAccessibility();
    sendResponse({ results: results });
  } else if (request.action === "clearVisualFeedback") {
    clearVisualFeedback();
    sendResponse({ success: true });
  } else if (request.action === "scrollToImage") {
    scrollToImage(request.imageId);
    sendResponse({ success: true });
  } else if (request.action === "scrollToLink") {
    scrollToLink(request.linkId);
    sendResponse({ success: true });
  } else if (request.action === "scrollToSVG") {
    scrollToSVG(request.svgId);
    sendResponse({ success: true });
  } else if (request.action === "scrollToHeading") {
    scrollToHeading(request.headingId);
    sendResponse({ success: true });
  } else if (request.action === "scrollToForm") {
    scrollToForm(request.formId);
    sendResponse({ success: true });
  } else if (request.action === "scrollToButton") {
    scrollToButton(request.buttonId);
    sendResponse({ success: true });
  } else if (request.action === "applyColorblindFilter") {
    applyColorblindFilter(request.filterType);
    sendResponse({ success: true });
  } else if (request.action === "updateFilters") {
    updateVisualMarkersWithFilters(request.filters);
    sendResponse({ success: true });
  }
  return true;
});

// Fonction pour mettre à jour les marqueurs visuels selon les filtres actifs
function updateVisualMarkersWithFilters(filters) {
  // Images - utiliser le tableau stocké
  markedElements.images.forEach((img) => {
    if (!img.parentElement) {
      return;
    }

    const badge = img.parentElement.querySelector(
      '[data-badge-for^="accessibility-img-"]',
    );

    if (filters.images) {
      // Réactiver les marqueurs
      img.style.border = "5px solid #ef4444";
      img.style.outline = "5px solid #cc0808";
      img.style.outlineOffset = "3px";
      img.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.6)";
      img.style.animation = "pulse-red 2s infinite";
      if (badge) badge.style.display = "";
    } else {
      // Masquer les marqueurs
      img.style.border = "none";
      img.style.outline = "none";
      img.style.outlineOffset = "0";
      img.style.boxShadow = "none";
      img.style.animation = "none";
      if (badge) badge.style.display = "none";
    }
  });

  // SVG - utiliser le tableau stocké
  markedElements.svgs.forEach((svg) => {
    if (!svg.parentElement) return;

    const badge = svg.parentElement.querySelector(".accessibility-badge-svg");

    if (filters.svg) {
      svg.style.outline = "5px solid #a855f7";
      svg.style.outlineOffset = "3px";
      svg.style.boxShadow = "0 0 20px rgba(168, 85, 247, 0.6)";
      if (badge) badge.style.display = "";
    } else {
      svg.style.outline = "none";
      svg.style.outlineOffset = "0";
      svg.style.boxShadow = "none";
      if (badge) badge.style.display = "none";
    }
  });

  // Liens - utiliser le tableau stocké
  markedElements.links.forEach((link) => {
    if (!link.parentElement) return;

    const badge = link.parentElement.querySelector(".accessibility-badge-link");
    const issue = link.getAttribute("data-accessibility-issue");

    if (filters.links) {
      // Réappliquer le style selon le type d'issue
      if (issue === "missing-text") {
        link.style.outline = "3px solid #f97316";
      } else if (issue === "bad-text") {
        link.style.outline = "3px solid #fbbf24";
      }
      link.style.outlineOffset = "2px";
      if (badge) badge.style.display = "";
    } else {
      link.style.outline = "none";
      link.style.outlineOffset = "0";
      if (badge) badge.style.display = "none";
    }
  });

  // Titres - utiliser le tableau stocké
  markedElements.headings.forEach((heading) => {
    if (!heading.parentElement) return;

    const badge = heading.parentElement.querySelector(
      ".accessibility-badge-heading",
    );

    if (filters.headings) {
      heading.style.outline = "4px solid #3b82f6";
      heading.style.outlineOffset = "2px";
      if (badge) badge.style.display = "";
    } else {
      heading.style.outline = "none";
      heading.style.outlineOffset = "0";
      if (badge) badge.style.display = "none";
    }
  });

  // Formulaires - utiliser le tableau stocké
  markedElements.forms.forEach((form) => {
    if (!form.parentElement) return;

    const badge = form.parentElement.querySelector(".accessibility-badge-form");

    if (filters.forms) {
      form.style.outline = "4px solid #f59e0b";
      form.style.outlineOffset = "2px";
      if (badge) badge.style.display = "";
    } else {
      form.style.outline = "none";
      form.style.outlineOffset = "0";
      if (badge) badge.style.display = "none";
    }
  });

  // Boutons - utiliser le tableau stocké
  markedElements.buttons.forEach((button) => {
    if (!button.parentElement) return;

    const badge = button.parentElement.querySelector(
      ".accessibility-badge-button",
    );

    if (filters.buttons) {
      button.style.outline = "4px solid #10b981";
      button.style.outlineOffset = "2px";
      if (badge) badge.style.display = "";
    } else {
      button.style.outline = "none";
      button.style.outlineOffset = "0";
      if (badge) badge.style.display = "none";
    }
  });
}
