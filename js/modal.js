import { showToast } from "./main.js";

const modal = document.querySelector("[data-product-modal]");
const selectors = {
  image: "[data-modal-image]",
  title: "[data-modal-title]",
  description: "[data-modal-description]",
  category: "[data-modal-category]",
  price: "[data-modal-price]",
  rating: "[data-modal-rating]"
};

let lastFocusedElement = null;

const getProductData = (card) => ({
  image: card.querySelector("img")?.getAttribute("src") || "images/product-placeholder.svg",
  alt: card.querySelector("img")?.getAttribute("alt") || "Product preview",
  title: card.querySelector(".product-card__title, h3")?.textContent.trim() || "TechNova product",
  description: card.querySelector(".product-card__body p")?.textContent.trim() || "Premium electronics product from TechNova.",
  category: card.querySelector(".chip")?.textContent.trim() || card.dataset.productCategory || "Product",
  price: card.querySelector(".price")?.textContent.trim() || "$0",
  rating: card.querySelector(".rating")?.textContent.trim() || "0.0"
});

const trapFocus = (event) => {
  if (!modal || modal.hidden || event.key !== "Tab") return;

  const focusable = [...modal.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const closeModal = () => {
  if (!modal || modal.hidden) return;
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    modal.hidden = true;
    lastFocusedElement?.focus();
  }, 180);
};

const openModal = (card) => {
  if (!modal || !card) return;

  const data = getProductData(card);
  const image = modal.querySelector(selectors.image);
  image.src = data.image;
  image.alt = data.alt;
  modal.querySelector(selectors.title).textContent = data.title;
  modal.querySelector(selectors.description).textContent = data.description;
  modal.querySelector(selectors.category).textContent = data.category;
  modal.querySelector(selectors.price).textContent = data.price;
  modal.querySelector(selectors.rating).textContent = data.rating;

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  window.requestAnimationFrame(() => modal.classList.add("is-open"));
  modal.querySelector(".modal__panel").focus();
  showToast("Quick view opened", "info");
};

const initModal = () => {
  if (!modal) return;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-product-card] .btn");
    if (!trigger) return;

    event.preventDefault();
    openModal(trigger.closest("[data-product-card]"));
  });

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    trapFocus(event);
  });
};

initModal();
