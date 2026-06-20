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
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;

    event.preventDefault();
    const messageMap = {
      "open-cart": "🚧 Cart feature is coming soon.",
      login: "🚧 Login feature is coming soon."
    };

    showToast(messageMap[action.dataset.action] || "Feature coming soon.", "info");
  });
};

initLoader();
initNavigation();
initTheme(showToast);
initBackToTop();
initSmoothScrolling();
initPlaceholderActions();
