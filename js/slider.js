const slides = [
  {
    image: "images/hero-placeholder.svg",
    alt: "Stylish showcase of modern smart electronics on a premium display",
    kicker: "Featured this week",
    title: "Nova X1 Pro",
    copy: "Ultra-fast performance, edge-to-edge clarity, and a finish built for modern desks."
  },
  {
    image: "images/product-placeholder.svg",
    alt: "Premium laptop and accessories displayed for a modern work setup",
    kicker: "Creator pick",
    title: "Aero Book 16",
    copy: "A refined workstation experience for editing, multitasking, and everyday productivity."
  },
  {
    image: "images/category-placeholder.svg",
    alt: "Smart electronics category preview with compact modern devices",
    kicker: "New arrivals",
    title: "Sound Pods Max",
    copy: "Balanced audio, pocket-ready charging, and a clean listening experience for every day."
  }
];

const intervalMs = 4500;

const initSlider = () => {
  const slider = document.querySelector("[data-slider]");
  if (!slider) return;

  const image = slider.querySelector("[data-slider-image]");
  const kicker = slider.querySelector("[data-slider-kicker]");
  const title = slider.querySelector("[data-slider-title]");
  const copy = slider.querySelector("[data-slider-copy]");
  const prev = slider.querySelector("[data-slider-prev]");
  const next = slider.querySelector("[data-slider-next]");
  const dots = [...slider.querySelectorAll(".slider-dot")];
  let currentIndex = 0;
  let timerId;
  let touchStartX = 0;

  const renderSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    const slide = slides[currentIndex];

    slider.classList.add("is-changing");

    window.setTimeout(() => {
      image.src = slide.image;
      image.alt = slide.alt;
      kicker.textContent = slide.kicker;
      title.textContent = slide.title;
      copy.textContent = slide.copy;

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", String(isActive));
      });

      slider.classList.remove("is-changing");
    }, 160);
  };

  const stopAutoplay = () => window.clearInterval(timerId);
  const startAutoplay = () => {
    stopAutoplay();
    timerId = window.setInterval(() => renderSlide(currentIndex + 1), intervalMs);
  };

  prev.addEventListener("click", () => {
    renderSlide(currentIndex - 1);
    startAutoplay();
  });

  next.addEventListener("click", () => {
    renderSlide(currentIndex + 1);
    startAutoplay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      renderSlide(index);
      startAutoplay();
    });
  });

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);
  slider.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  slider.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) < 40) return;
    renderSlide(deltaX > 0 ? currentIndex - 1 : currentIndex + 1);
    startAutoplay();
  }, { passive: true });

  startAutoplay();
};

initSlider();
