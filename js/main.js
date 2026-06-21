import { initNavigation } from "./navigation.js";
import { initTheme } from "./theme.js";

const toastRegion = document.querySelector("[data-toast-region]");
const toastStateByMessage = new Map();
const toastDuration = 3200;

const clearToastDismissal = (state) => {
  if (!state) return;

  if (state.timeoutId) {
    window.clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  if (state.cleanup) {
    state.cleanup();
    state.cleanup = null;
  }
};

const scheduleToastDismissal = (message, state) => {
  state.timeoutId = window.setTimeout(() => {
    const currentState = toastStateByMessage.get(message);
    if (!currentState || currentState !== state) return;

    state.element.classList.remove("is-visible");

    const handleTransitionEnd = (event) => {
      if (event.target !== state.element) return;
      if (toastStateByMessage.get(message) !== state) return;

      state.element.removeEventListener("transitionend", handleTransitionEnd);
      toastStateByMessage.delete(message);
      state.cleanup = null;

      if (state.element.isConnected) {
        state.element.remove();
      }
    };

    state.cleanup = () => {
      state.element.removeEventListener("transitionend", handleTransitionEnd);
    };

    state.element.addEventListener("transitionend", handleTransitionEnd);
  }, toastDuration);
};

export const showToast = (message, type = "success") => {
  if (!toastRegion || !message) return;

  const toastMessage = String(message);
  let state = toastStateByMessage.get(toastMessage);

  if (!state || !state.element.isConnected) {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = toastMessage;
    toastRegion.append(toast);

    state = {
      element: toast,
      timeoutId: null,
      cleanup: null
    };

    toastStateByMessage.set(toastMessage, state);
  } else {
    state.element.className = `toast toast--${type}`;
    state.element.setAttribute("role", "status");
    state.element.textContent = toastMessage;
  }

  clearToastDismissal(state);

  window.requestAnimationFrame(() => state.element.classList.add("is-visible"));
  scheduleToastDismissal(toastMessage, state);
};

const initLoader = () => {
  const loader = document.querySelector("[data-loader]");
  if (!loader) return;

  const hideLoader = () => {
    loader.classList.add("is-hidden");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  };

  if (document.readyState === "complete") {
    hideLoader();
    return;
  }

  window.addEventListener("load", hideLoader, { once: true });
};

const initBackToTop = () => {
  const button = document.querySelector("[data-back-to-top]");
  if (!button) return;

  let ticking = false;

  const updateButton = () => {
    button.classList.toggle("is-visible", window.scrollY > 420);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateButton);
        ticking = true;
      }
    },
    { passive: true }
  );

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateButton();
};

const initSmoothScrolling = () => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const initPlaceholderActions = () => {
  const messageMap = {
    "open-cart": "🚧 Cart feature is coming soon.",
    login: "🚧 Login feature is coming soon."
  };

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;

    const message = messageMap[action.dataset.action];
    if (!message) return;

    event.preventDefault();
    showToast(message, "info");
  });
};

initLoader();
initNavigation();
initTheme();
initBackToTop();
initSmoothScrolling();
initPlaceholderActions();
const normalizeCatalogValue = (value) => String(value || "").trim().toLowerCase();

const initCatalogFilters = () => {
  const form = document.querySelector("[data-form='catalog-tools']");
  const grid = document.querySelector("[data-section='catalog-grid'] .card-grid--catalog");

  if (!form || !grid) return;

  const searchInput = form.querySelector("#catalog-search");
  const categorySelect = form.querySelector("#catalog-category");
  const sortSelect = form.querySelector("#catalog-sort");
  const cards = [...grid.querySelectorAll("[data-product-card]")];

  if (!searchInput || !categorySelect || !sortSelect || !cards.length) return;

  const indexedCards = cards.map((card, index) => {
    card.dataset.catalogIndex = String(index);
    return {
      card,
      index,
      title: normalizeCatalogValue(card.querySelector(".product-card__title, h3")?.textContent),
      category: normalizeCatalogValue(card.dataset.productCategory)
    };
  });

  const getPrice = (card) =>
    Number.parseFloat(card.querySelector(".price")?.textContent.replace(/[^0-9.]/g, "") || "0");

  const getRating = (card) =>
    Number.parseFloat(card.querySelector(".rating")?.textContent.replace(/[^0-9.]/g, "") || "0");

  const sortCards = (items, sortValue) => {
    const sorted = [...items];

    switch (sortValue) {
      case "price-asc":
        sorted.sort((a, b) => getPrice(a.card) - getPrice(b.card) || a.index - b.index);
        break;
      case "price-desc":
        sorted.sort((a, b) => getPrice(b.card) - getPrice(a.card) || a.index - b.index);
        break;
      case "rating-desc":
        sorted.sort((a, b) => getRating(b.card) - getRating(a.card) || a.index - b.index);
        break;
      case "newest":
        sorted.sort((a, b) => b.index - a.index);
        break;
      default:
        sorted.sort((a, b) => a.index - b.index);
        break;
    }

    return sorted;
  };

  const applyFilters = () => {
    const query = normalizeCatalogValue(searchInput.value);
    const categoryValue = normalizeCatalogValue(categorySelect.value);
    const sortValue = normalizeCatalogValue(sortSelect.value);

    const hasActiveFilters =
      Boolean(query) || categoryValue !== "all" || sortValue !== "featured";

    if (!hasActiveFilters) {
      cards.forEach((card) => {
        card.hidden = false;
      });
      grid.replaceChildren(...indexedCards.map(({ card }) => card));
      return;
    }

    const visibleItems = indexedCards.filter(({ title, category }) => {
      const matchesSearch = !query || title.includes(query) || category.includes(query);
      const matchesCategory = categoryValue === "all" || category === categoryValue;
      return matchesSearch && matchesCategory;
    });

    const visibleSet = new Set(visibleItems.map(({ card }) => card));
    const sortedVisibleItems = sortCards(visibleItems, sortValue);

    cards.forEach((card) => {
      card.hidden = !visibleSet.has(card);
    });

    grid.replaceChildren(...sortedVisibleItems.map(({ card }) => card));
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
  });

  applyFilters();
};

initCatalogFilters();
