// Popup script pour afficher les résultats de l'audit

// État des filtres actifs
let activeFilters = {
  images: true,
  svg: true,
  links: true,
  headings: true,
  forms: true,
  colorblind: true,
  structure: true,
  buttons: true,
};

// Stocker les résultats complets pour pouvoir les filtrer
let fullResults = null;

document.addEventListener("DOMContentLoaded", function () {
  runAudit();

  // Gestionnaire pour le bouton d'effacement des marqueurs
  document
    .getElementById("clearMarkersBtn")
    .addEventListener("click", clearMarkers);

  // Gestionnaires pour les filtres
  setupFilterHandlers();
});

async function clearMarkers() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "clearVisualFeedback" },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
        // Confirmation visuelle (optionnel)
        const btn = document.getElementById("clearMarkersBtn");
        const originalText = btn.textContent;
        btn.textContent = "✓ Marqueurs effacés";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      },
    );
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);
  }
}

async function navigateToImage(imageId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToImage", imageId: imageId },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la navigation:", error);
  }
}

async function navigateToLink(linkId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToLink", linkId: linkId },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la navigation:", error);
  }
}

function copyGitHubMarkdown(issue, category, buttonElement) {
  const categoryNames = {
    images: "Image",
    svg: "SVG",
    links: "Lien",
    headings: "Titre",
    forms: "Formulaire",
    colorblind: "Daltonisme",
    structure: "Structure",
  };

  const priorityEmojis = {
    élevée: "🔴",
    moyenne: "🟡",
    faible: "🔵",
  };

  const categoryName = categoryNames[category] || category;
  const priorityEmoji = priorityEmojis[issue.severity] || "⚪";

  // Générer le Markdown standard
  let markdown = `## ${priorityEmoji} [Accessibilité] ${issue.issue}\n\n`;
  markdown += `**Type :** ${categoryName}\n`;
  markdown += `**Priorité :** ${issue.severity}\n`;
  markdown += `**Élément :** ${issue.element}\n\n`;

  markdown += `### 📋 Description du problème\n\n`;
  markdown += `${issue.issue}\n\n`;

  if (issue.explanation) {
    markdown += `> 💡 **Impact sur l'accessibilité**\n`;
    markdown += `> \n`;
    markdown += `> ${issue.explanation}\n\n`;
  }

  markdown += `### 🔍 Détails techniques\n\n`;
  if (issue.src) {
    markdown += `- **Source :** \`${issue.src}\`\n`;
  }
  if (issue.href) {
    markdown += `- **Lien :** \`${issue.href}\`\n`;
  }
  if (issue.text) {
    markdown += `- **Texte actuel :** "${issue.text}"\n`;
  }
  if (issue.type) {
    markdown += `- **Type :** ${issue.type}\n`;
  }

  markdown += `\n`;
  markdown += `### ✅ Solution recommandée\n\n`;

  // Suggestions selon le type d'erreur
  if (category === "images") {
    markdown += `\`\`\`html\n<img src="..." alt="Description de l'image" />\n\`\`\`\n\n`;
    markdown += `Ajouter un attribut \`alt\` descriptif à l'image.\n`;
  } else if (category === "svg") {
    markdown += `\`\`\`html\n<svg role="img" aria-label="Description du SVG">\n  <!-- ou -->\n  <title>Description du SVG</title>\n</svg>\n\`\`\`\n\n`;
    markdown += `Ajouter \`role="img"\` + \`aria-label\`, ou un élément \`<title>\` interne.\n`;
  } else if (category === "links") {
    markdown += `\`\`\`html\n<a href="..." aria-label="Description du lien">Texte du lien</a>\n\`\`\`\n\n`;
    markdown += `Ajouter un texte descriptif ou un attribut \`aria-label\`.\n`;
  } else if (category === "headings") {
    markdown += `Respecter la hiérarchie des titres (H1 → H2 → H3).\n`;
  } else if (category === "forms") {
    markdown += `\`\`\`html\n<label for="input-id">Label du champ</label>\n<input id="input-id" type="text" />\n\`\`\`\n\n`;
    markdown += `Associer un \`<label>\` à chaque champ de formulaire.\n`;
  } else if (category === "structure") {
    markdown += `Vérifier la structure HTML du document (landmarks, régions ARIA).\n`;
  }

  markdown += `\n`;
  markdown += `### 📚 Ressources\n\n`;

  // Lien MDN spécifique selon la catégorie
  if (category === "images") {
    markdown += `- [MDN - Accessibilité des images](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#accessibilit%C3%A9)\n`;
  } else if (category === "svg") {
    markdown += `- [MDN - Identifier le SVG comme une image](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#identifier_le_svg_comme_une_image)\n`;
  } else if (category === "links") {
    markdown += `- [MDN - Créer un lien avec une image](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#cr%C3%A9er_un_lien_avec_une_image)\n`;
  } else if (category === "headings") {
    markdown += `- [MDN - Structurer le contenu avec des titres](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/Heading_Elements#accessibilit%C3%A9)\n`;
  } else if (category === "forms") {
    markdown += `- [MDN - Formulaires accessibles](https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/input#accessibilit%C3%A9)\n`;
  } else if (category === "structure") {
    markdown += `- [MDN - Structure du document](https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility/HTML#une_bonne_s%C3%A9mantique)\n`;
  }

  markdown += `- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)\n`;
  markdown += `- Testé avec l'extension Audit d'Accessibilité Web\n`;

  // Copier dans le presse-papier
  navigator.clipboard
    .writeText(markdown)
    .then(() => {
      // Feedback visuel
      const originalText = buttonElement.textContent;
      buttonElement.textContent = "✓ Copié !";
      buttonElement.style.background = "#10b981";

      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.style.background = "";
      }, 2000);
    })
    .catch((err) => {
      console.error("Erreur lors de la copie:", err);
      buttonElement.textContent = "❌ Erreur";
      setTimeout(() => {
        buttonElement.textContent = "📝 Copier Markdown";
      }, 2000);
    });
}

async function navigateToSVG(svgId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToSVG", svgId: svgId },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la navigation:", error);
  }
}

async function navigateToHeading(headingId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToHeading", headingId: headingId },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la navigation:", error);
  }
}

async function navigateToForm(formId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToForm", formId: formId },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la navigation:", error);
  }
}

// Fonction pour appliquer un filtre de daltonisme
async function applyColorblindFilter(filterType) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "applyColorblindFilter", filterType: filterType },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de l'application du filtre:", error);
  }
}

async function runAudit() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "runAudit" },
      function (response) {
        if (chrome.runtime.lastError) {
          showError(
            "Erreur: Impossible d'analyser cette page. Actualisez la page et réessayez.",
          );
          return;
        }

        if (response && response.results) {
          // Stocker les résultats complets
          fullResults = response.results;
          displayResults(response.results);
        }
      },
    );
  } catch (error) {
    showError("Erreur lors de l'analyse: " + error.message);
  }
}

function displayResults(results) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "block";

  // Stocker les résultats complets
  fullResults = results;

  // Filtrer les résultats selon les filtres actifs
  const filteredResults = filterResults(results);

  // Calculer le score global (basé sur les résultats filtrés)
  let totalIssues = 0;
  let totalTests = 0;

  Object.values(filteredResults).forEach((category) => {
    totalIssues += category.issues.length;
    totalTests += category.total;
  });

  const score =
    totalTests > 0 ? Math.round((1 - totalIssues / totalTests) * 100) : 100;

  // Afficher le score
  document.getElementById("totalScore").textContent = score + "%";
  document.getElementById("totalPassed").textContent = totalTests - totalIssues;
  document.getElementById("totalFailed").textContent = totalIssues;

  // Colorier le score
  const scoreElement = document.getElementById("totalScore");
  if (score >= 80) {
    scoreElement.style.color = "#10b981";
  } else if (score >= 60) {
    scoreElement.style.color = "#f59e0b";
  } else {
    scoreElement.style.color = "#ef4444";
  }

  // Masquer/afficher les catégories selon les filtres
  document.getElementById("imagesCategory").style.display = activeFilters.images
    ? "block"
    : "none";
  document.getElementById("svgCategory").style.display = activeFilters.svg
    ? "block"
    : "none";
  document.getElementById("linksCategory").style.display = activeFilters.links
    ? "block"
    : "none";
  document.getElementById("headingsCategory").style.display =
    activeFilters.headings ? "block" : "none";
  document.getElementById("formsCategory").style.display = activeFilters.forms
    ? "block"
    : "none";
  document.getElementById("colorblindCategory").style.display = "block";
  document.getElementById("structureCategory").style.display =
    activeFilters.structure || activeFilters.buttons ? "block" : "none";

  // Afficher les résultats par catégorie
  displayCategory(
    "images",
    filteredResults.images,
    "imagesContent",
    "imagesBadge",
  );
  displayCategory("svg", filteredResults.svg, "svgContent", "svgBadge");
  displayCategory("links", filteredResults.links, "linksContent", "linksBadge");
  displayCategory(
    "headings",
    filteredResults.headings,
    "headingsContent",
    "headingsBadge",
  );
  displayCategory("forms", filteredResults.forms, "formsContent", "formsBadge");

  // Simulateur de daltonisme - ajouter les handlers de boutons
  document.querySelectorAll(".colorblind-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterType = btn.getAttribute("data-filter");
      applyColorblindFilter(filterType);

      // Feedback visuel
      document
        .querySelectorAll(".colorblind-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Combiner lang et landmarks pour la structure
  const structureIssues = [
    ...filteredResults.lang.issues,
    ...filteredResults.landmarks.issues,
    ...filteredResults.buttons.issues,
  ];
  displayCategory(
    "structure",
    {
      total:
        filteredResults.lang.total +
        filteredResults.landmarks.total +
        filteredResults.buttons.total,
      issues: structureIssues,
      passed:
        filteredResults.lang.passed +
        filteredResults.landmarks.passed +
        filteredResults.buttons.passed,
    },
    "structureContent",
    "structureBadge",
  );

  // Export button
  document
    .getElementById("exportBtn")
    .addEventListener("click", () => exportReport(filteredResults, score));

  // Attacher les gestionnaires de switches
  attachSwitchHandlers();
}

function displayCategory(name, data, contentId, badgeId) {
  const contentElement = document.getElementById(contentId);
  const badgeElement = document.getElementById(badgeId);

  badgeElement.textContent = data.issues.length;

  if (data.issues.length > 0) {
    badgeElement.classList.add("badge-error");
  } else {
    badgeElement.classList.add("badge-success");
  }

  if (data.issues.length === 0) {
    contentElement.innerHTML =
      '<p class="success-message">✅ Aucun problème détecté</p>';
  } else {
    contentElement.innerHTML = data.issues
      .map(
        (issue, issueIndex) => `
      <div class="issue ${issue.severity}">
        <div class="issue-header">
          <span class="issue-element">${issue.element}</span>
          <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
        </div>
        <p class="issue-description">${issue.issue}</p>
        ${issue.explanation ? `<p class="issue-explanation">💡 ${issue.explanation}</p>` : ""}
        ${
          getMdnLinks(name).length > 0
            ? getMdnLinks(name)
                .map(
                  (link) =>
                    `<p class="issue-mdn-link">📚 <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title}</a></p>`,
                )
                .join("")
            : ""
        }
        ${issue.text ? `<p class="issue-detail">Texte: "${issue.text.length > 80 ? issue.text.substring(0, 80) + "..." : issue.text}"</p>` : ""}
        ${issue.src ? `<p class="issue-detail">Source: ${issue.src.length > 60 ? issue.src.substring(0, 60) + "..." : issue.src}</p>` : ""}
        ${issue.href ? `<p class="issue-detail">Lien: ${issue.href.length > 60 ? issue.href.substring(0, 60) + "..." : issue.href}</p>` : ""}
        ${issue.type ? `<p class="issue-detail">Type: ${issue.type}</p>` : ""}
        ${issue.imageId ? `<button class="goto-btn" data-image-id="${issue.imageId}">Voir dans la page</button>` : ""}
        ${issue.linkId ? `<button class="goto-btn" data-link-id="${issue.linkId}">Voir dans la page</button>` : ""}
        ${issue.svgId ? `<button class="goto-btn" data-svg-id="${issue.svgId}">Voir dans la page</button>` : ""}
        ${issue.headingId ? `<button class="goto-btn" data-heading-id="${issue.headingId}">Voir dans la page</button>` : ""}
        ${issue.formId ? `<button class="goto-btn" data-form-id="${issue.formId}">Voir dans la page</button>` : ""}
        <button class="markdown-btn" data-issue-index="${issueIndex}" data-category="${name}">Copier Markdown</button>
      </div>
    `,
      )
      .join("");

    // Ajouter les écouteurs d'événements pour les boutons de navigation
    if (name === "images") {
      contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const imageId = btn.getAttribute("data-image-id");
          navigateToImage(imageId);
        });
      });
    }

    if (name === "links") {
      contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const linkId = btn.getAttribute("data-link-id");
          navigateToLink(linkId);
        });
      });
    }

    if (name === "svg") {
      contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const svgId = btn.getAttribute("data-svg-id");
          navigateToSVG(svgId);
        });
      });
    }

    if (name === "headings") {
      contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const headingId = btn.getAttribute("data-heading-id");
          navigateToHeading(headingId);
        });
      });
    }

    if (name === "forms") {
      contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const formId = btn.getAttribute("data-form-id");
          navigateToForm(formId);
        });
      });
    }

    // Ajouter les écouteurs pour les boutons Markdown
    contentElement.querySelectorAll(".markdown-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const issueIndex = parseInt(btn.getAttribute("data-issue-index"));
        const category = btn.getAttribute("data-category");
        const issue = data.issues[issueIndex];
        copyGitHubMarkdown(issue, category, btn);
      });
    });
  }
}

function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").innerHTML = `
    <div class="error-message">
      <p>⚠️ ${message}</p>
    </div>
  `;
  document.getElementById("results").style.display = "block";
}

function exportReport(results, score) {
  const reportDate = new Date().toLocaleDateString("fr-FR");
  let report = `RAPPORT D'AUDIT D'ACCESSIBILITÉ\n`;
  report += `Date: ${reportDate}\n`;
  report += `Score global: ${score}%\n\n`;
  report += `=${"=".repeat(50)}\n\n`;

  Object.entries(results).forEach(([category, data]) => {
    report += `${category.toUpperCase()}\n`;
    report += `-${"-".repeat(50)}\n`;
    report += `Total d'éléments vérifiés: ${data.total}\n`;
    report += `Problèmes détectés: ${data.issues.length}\n\n`;

    if (data.issues.length > 0) {
      data.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.element}\n`;
        report += `   Problème: ${issue.issue}\n`;
        report += `   Sévérité: ${issue.severity}\n`;
        if (issue.text) report += `   Texte: ${issue.text}\n`;
        if (issue.src) report += `   Source: ${issue.src}\n`;
        if (issue.href) report += `   Lien: ${issue.href}\n`;
        report += `\n`;
      });
    } else {
      report += `✅ Aucun problème détecté\n\n`;
    }

    report += `\n`;
  });

  // Télécharger le rapport
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-accessibilite-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Fonction pour obtenir le lien MDN selon la catégorie
function getMdnLinks(category) {
  const mdnLinks = {
    images: [
      {
        title: "Accessibilité des images",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#accessibilit%C3%A9",
      },
    ],
    svg: [
      {
        title: "Identifier le SVG comme une image",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#identifier_le_svg_comme_une_image",
      },
      {
        title: "Accessibilité des SVG",
        url: "https://developer.mozilla.org/fr/docs/Web/SVG/Guides/SVG_in_HTML#bonnes_pratiques",
      },
    ],
    links: [
      {
        title: "Accessibilité des liens",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/a#accessibilit%C3%A9",
      },
      {
        title: "Créer un lien avec une image",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/img#cr%C3%A9er_un_lien_avec_une_image",
      },
    ],
    headings: [
      {
        title: "Structurer le contenu avec des titres",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/Heading_Elements#accessibilit%C3%A9",
      },
    ],
    forms: [
      {
        title: "Formulaires accessibles",
        url: "https://developer.mozilla.org/fr/docs/Web/HTML/Reference/Elements/input#accessibilit%C3%A9",
      },
    ],
    structure: [
      {
        title: "Structure du document",
        url: "https://developer.mozilla.org/fr/docs/Learn_web_development/Core/Accessibility/HTML#une_bonne_s%C3%A9mantique",
      },
    ],
  };
  return mdnLinks[category] || [];
}

// Fonction pour filtrer les résultats selon les filtres actifs
function filterResults(results) {
  const filtered = {
    images: activeFilters.images
      ? results.images
      : { total: 0, issues: [], passed: 0 },
    svg: activeFilters.svg ? results.svg : { total: 0, issues: [], passed: 0 },
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

// Fonction pour configurer les gestionnaires de filtres
function setupFilterHandlers() {
  // Cette fonction sera appelée après l'affichage des résultats
  // pour attacher les gestionnaires aux switches dans les headers
}

// Fonction pour ajouter les gestionnaires de switches dans les headers
function attachSwitchHandlers() {
  const checkboxes = document.querySelectorAll(".audit-filter");
  console.log("Attaching handlers to", checkboxes.length, "switches");

  checkboxes.forEach((checkbox, index) => {
    // Supprimer tout event listener existant en utilisant un attribut data
    if (checkbox.dataset.handlerAttached === "true") {
      console.log("Handler already attached to checkbox", index);
      return;
    }

    checkbox.dataset.handlerAttached = "true";

    // Utiliser addEventListener avec capture pour être sûr de capturer l'événement
    checkbox.addEventListener(
      "change",
      function (e) {
        e.stopPropagation(); // Empêcher la propagation au header

        const category = this.getAttribute("data-category");
        const categoryElement = document.getElementById(category + "Category");
        const isChecked = this.checked;

        console.log("===== Switch changed =====");
        console.log("Category:", category);
        console.log("Is checked:", isChecked);
        console.log("Current activeFilters before update:", {
          ...activeFilters,
        });

        if (isChecked) {
          // Réactiver la catégorie
          categoryElement.classList.remove("disabled");
          activeFilters[category] = true;
          console.log("✅ ACTIVATING", category);
        } else {
          // Désactiver la catégorie
          categoryElement.classList.add("disabled");
          activeFilters[category] = false;
          console.log("❌ DEACTIVATING", category);
        }

        console.log("Active filters after update:", { ...activeFilters });
        console.log("=========================");

        // Mettre à jour le score global
        updateScore();

        // Mettre à jour les marqueurs visuels
        updateVisualMarkers();
      },
      true,
    ); // Utiliser capture phase

    console.log(
      "Handler attached to checkbox",
      index,
      "for category",
      checkbox.getAttribute("data-category"),
    );
  });
}

// Fonction pour recalculer et afficher le score global
function updateScore() {
  if (!fullResults) return;

  const filteredResults = filterResults(fullResults);

  let totalIssues = 0;
  let totalTests = 0;

  Object.values(filteredResults).forEach((category) => {
    totalIssues += category.issues.length;
    totalTests += category.total;
  });

  const score =
    totalTests > 0 ? Math.round((1 - totalIssues / totalTests) * 100) : 100;

  // Afficher le score
  document.getElementById("totalScore").textContent = score + "%";
  document.getElementById("totalPassed").textContent = totalTests - totalIssues;
  document.getElementById("totalFailed").textContent = totalIssues;

  // Colorier le score
  const scoreElement = document.getElementById("totalScore");
  if (score >= 80) {
    scoreElement.style.color = "#10b981";
  } else if (score >= 60) {
    scoreElement.style.color = "#f59e0b";
  } else {
    scoreElement.style.color = "#ef4444";
  }
}

// Fonction pour mettre à jour les marqueurs visuels selon les filtres
async function updateVisualMarkers() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "updateFilters", filters: activeFilters },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error("Erreur:", chrome.runtime.lastError);
          return;
        }
      },
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour des marqueurs:", error);
  }
}
