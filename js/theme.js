const storageKey = "technova-theme";

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme, button) => {
  document.documentElement.dataset.theme = theme;

  if (!button) return;

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-pressed", String(isDark));
  button.dataset.theme = theme;
};

export const initTheme = () => {
  const button = document.querySelector("[data-theme-toggle]");
  const initialTheme = getPreferredTheme();

  applyTheme(initialTheme, button);

  if (!button) return;

  button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme, button);
  });
};
