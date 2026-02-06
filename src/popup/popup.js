// Popup script pour afficher les résultats de l'audit

import { TIMEOUTS, SCORES } from "../utils/constants.js";
import {
  generateGitHubMarkdown,
  copyMarkdownToClipboard,
} from "../utils/markdown.js";

// État des filtres actifs
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

// Stocker les résultats complets pour pouvoir les filtrer
let fullResults = null;

// Constantes pour la longueur maximale d'affichage des textes
const MAX_TEXT_LENGTH = 80;
const MAX_URL_LENGTH = 60;

document.addEventListener("DOMContentLoaded", function () {
  // Initialiser le mode dark
  initDarkMode();

  runAudit();

  // Handler for markers clear button
  document
    .getElementById("clearMarkersBtn")
    .addEventListener("click", clearMarkers);

  // Handlers for filters
  setupFilterHandlers();

  // Handler for dark mode toggle
  document
    .getElementById("toggle-dark-mode")
    .addEventListener("click", toggleDarkMode);
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

async function navigateToImage(imageId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToImage", imageId: imageId },
      function (_response) {
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
      function (_response) {
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
  const markdown = generateGitHubMarkdown(issue, category, getMdnLinks);
  copyMarkdownToClipboard(markdown, buttonElement, "✓ Copié !");
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
      function (_response) {
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
      function (_response) {
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
      function (_response) {
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

async function navigateToButton(buttonId) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(
      tab.id,
      { action: "scrollToButton", buttonId: buttonId },
      function (_response) {
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
      function (_response) {
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

    // Vérifier si le script est déjà injecté en testant la communication
    chrome.tabs.sendMessage(
      tab.id,
      { action: "ping" },
      async function (response) {
        // Si pas de réponse, le script n'est pas injecté
        if (chrome.runtime.lastError || !response) {
          // Inject content script
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["src/content/content.js"],
            });

            // Attendre que le script soit prêt puis lancer l'audit
            setTimeout(() => {
              launchAudit(tab.id);
            }, 100);
          } catch (injectionError) {
            showError(
              `Erreur d'injection du script: ${injectionError.message}`,
            );
          }
        } else {
          // Le script est déjà injecté, lancer l'audit directement
          launchAudit(tab.id);
        }
      },
    );
  } catch (error) {
    showError(`Erreur lors de l'analyse: ${error.message}`);
  }
}

function launchAudit(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "runAudit" }, function (response) {
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
  });
}

function displayResults(results) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "block";

  // Stocker les résultats complets
  fullResults = results;

  // Filtrer les résultats selon les filtres actifs
  const filteredResults = filterResults(results);

  // Calculer et afficher le score
  const score = calculateAndDisplayScore(filteredResults);

  // Appliquer la couleur au score
  const scoreElement = document.getElementById("totalScore");
  applyScoreColor(scoreElement, score);

  // Gérer la visibilité des catégories
  toggleCategoriesVisibility();

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

  // Attacher les listeners du simulateur de daltonisme
  attachColorblindListeners();

  // Afficher la catégorie structure combinée
  const structureData = combineStructureData(filteredResults);
  displayCategory(
    "structure",
    structureData,
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

// Calculer et afficher le score global
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
  document.getElementById("totalPassed").textContent = totalTests - totalIssues;
  document.getElementById("totalFailed").textContent = totalIssues;

  return score;
}

// Appliquer la couleur au score selon les seuils
function applyScoreColor(scoreElement, score) {
  if (score >= SCORES.GOOD_THRESHOLD) {
    scoreElement.style.color = "#10b981";
  } else if (score >= SCORES.MEDIUM_THRESHOLD) {
    scoreElement.style.color = "#f59e0b";
  } else {
    scoreElement.style.color = "#ef4444";
  }
}

// Gérer la visibilité des catégories selon les filtres actifs
function toggleCategoriesVisibility() {
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
}

// Attacher les event listeners pour le simulateur de daltonisme
function attachColorblindListeners() {
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
}

// Combiner les données de structure (lang, landmarks, buttons)
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

// Configuration des handlers de navigation par catégorie
const NAVIGATION_CONFIG = {
  images: { attr: "data-image-id", handler: navigateToImage },
  links: { attr: "data-link-id", handler: navigateToLink },
  svg: { attr: "data-svg-id", handler: navigateToSVG },
  headings: { attr: "data-heading-id", handler: navigateToHeading },
  forms: { attr: "data-form-id", handler: navigateToForm },
  structure: { attr: "data-button-id", handler: navigateToButton },
};

// Générer le HTML des liens MDN
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

// Générer le HTML des détails de l'issue
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

// Générer le HTML des boutons de navigation
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

// Générer le HTML d'une issue
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

// Attacher les event listeners pour les boutons de navigation
function attachNavigationListeners(contentElement, name) {
  const config = NAVIGATION_CONFIG[name];
  if (!config) {
    return;
  }

  contentElement.querySelectorAll(".goto-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const elementId = btn.getAttribute(config.attr);
      if (elementId) {
        config.handler(elementId);
      }
    });
  });
}

// Attacher les event listeners pour les boutons Markdown
function attachMarkdownListeners(contentElement, data) {
  contentElement.querySelectorAll(".markdown-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const issueIndex = parseInt(btn.getAttribute("data-issue-index"));
      const category = btn.getAttribute("data-category");
      const issue = data.issues[issueIndex];
      copyGitHubMarkdown(issue, category, btn);
    });
  });
}

// Attacher les event listeners pour les liens "Ressources"
function attachResourcesListeners(contentElement) {
  contentElement.querySelectorAll(".toggle-resources-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const resourcesId = btn.getAttribute("data-resources-id");
      const resourcesElement = document.getElementById(resourcesId);
      const textElement = btn.querySelector(".resources-text");

      if (resourcesElement.style.display === "none") {
        resourcesElement.style.display = "block";
        textElement.textContent = "Masquer";
        btn.classList.add("active");
      } else {
        resourcesElement.style.display = "none";
        textElement.textContent = "Ressources";
        btn.classList.remove("active");
      }
    });
  });
}

// Mettre à jour le badge d'une catégorie
function updateCategoryBadge(badgeElement, issuesCount) {
  badgeElement.textContent = issuesCount;

  if (issuesCount > 0) {
    badgeElement.classList.add("badge-error");
  } else {
    badgeElement.classList.add("badge-success");
  }
}

function displayCategory(name, data, contentId, badgeId) {
  const contentElement = document.getElementById(contentId);
  const badgeElement = document.getElementById(badgeId);

  // Mettre à jour le badge
  updateCategoryBadge(badgeElement, data.issues.length);

  // Afficher le message de succès ou les issues
  if (data.issues.length === 0) {
    contentElement.innerHTML =
      '<p class="success-message">✅ Aucun problème détecté</p>';
    return;
  }

  // Générer le HTML pour toutes les issues
  contentElement.innerHTML = data.issues
    .map((issue, issueIndex) => generateIssueHTML(issue, issueIndex, name))
    .join("");

  // Attacher tous les event listeners
  attachNavigationListeners(contentElement, name);
  attachMarkdownListeners(contentElement, data);
  attachResourcesListeners(contentElement);
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
  const reportDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportTime = new Date().toLocaleTimeString("fr-FR");

  // Obtenir l'URL de la page auditée
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const pageUrl = tabs[0]?.url || "Page inconnue";
    const pageTitle = tabs[0]?.title || "Sans titre";

    // Stocker les données du rapport dans session storage
    const reportData = {
      results,
      score,
      pageUrl,
      pageTitle,
      reportDate,
      reportTime,
    };

    chrome.storage.session.set({ reportData }, function () {
      // Ouvrir la page de rapport
      const reportUrl = chrome.runtime.getURL("src/report/report.html");
      chrome.tabs.create({ url: reportUrl });
    });
  });
}

// Fonction pour obtenir le lien MDN selon la catégorie
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
        const categoryElement = document.getElementById(`${category}Category`);
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
  if (!fullResults) {
    return;
  }

  const filteredResults = filterResults(fullResults);

  let totalIssues = 0;
  let totalTests = 0;

  Object.values(filteredResults).forEach((category) => {
    totalIssues += category.issues.length;
    totalTests += category.total;
  });

  const score =
    totalTests > 0 ? Math.round((1 - totalIssues / totalTests) * 100) : 100;

  // Display score
  document.getElementById("totalScore").textContent = `${score}%`;
  document.getElementById("totalPassed").textContent = totalTests - totalIssues;
  document.getElementById("totalFailed").textContent = totalIssues;

  // Color the score
  const scoreElement = document.getElementById("totalScore");
  if (score >= SCORES.GOOD_THRESHOLD) {
    scoreElement.style.color = "#10b981";
  } else if (score >= SCORES.MEDIUM_THRESHOLD) {
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
      function (_response) {
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

// ==================== MODE DARK ====================

// Initialiser le mode dark depuis le stockage
function initDarkMode() {
  chrome.storage.sync.get(["darkMode"], function (result) {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });
}

// Basculer le mode dark
function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-mode");

  // Sauvegarder la préférence
  chrome.storage.sync.set({ darkMode: isDarkMode });
}
