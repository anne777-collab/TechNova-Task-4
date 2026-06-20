export const initNavigation = () => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-component='primary-nav']");
  if (!toggle || !nav) return;

  const focusableSelector = "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])";
  let pendingNavigationTimeoutId = null;
  let pendingNavigationHref = null;

  const runPendingNavigation = () => {
    if (!pendingNavigationHref) return;
    const nextLocation = pendingNavigationHref;
    pendingNavigationHref = null;
    pendingNavigationTimeoutId = null;
    window.location.assign(nextLocation);
  };

  const openNav = () => {
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
  };

  const closeNav = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
  };

  const closeNavAndNavigate = (href) => {
    if (!href) return;

    closeNav();
    if (pendingNavigationTimeoutId) window.clearTimeout(pendingNavigationTimeoutId);
    pendingNavigationHref = href;
    pendingNavigationTimeoutId = window.setTimeout(runPendingNavigation, 260);
  };

  toggle.addEventListener("click", () => {
    document.body.classList.contains("nav-open") ? closeNav() : openNav();
  });

  nav.addEventListener("click", (event) => {
    const link = event.target.closest(".nav__link");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) {
      closeNav();
      return;
    }

    event.preventDefault();
    closeNavAndNavigate(href);
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("nav-open")) return;

    if (event.key === "Escape") {
      closeNav();
      toggle.focus();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = [toggle, ...nav.querySelectorAll(focusableSelector)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 769px)").matches) closeNav();
  });
};
