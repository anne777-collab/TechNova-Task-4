const animateCounter = (counter) => {
  const target = Number(counter.dataset.target || 0);
  const suffix = counter.dataset.suffix || "";
  const duration = 1400;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(target * easedProgress);

    counter.textContent = `${value}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      counter.textContent = `${target}${suffix}`;
    }
  };

  window.requestAnimationFrame(tick);
};

const initCounters = () => {
  const section = document.querySelector("[data-counter-section]");
  const counters = [...document.querySelectorAll("[data-counter]")];
  if (!section || !counters.length) return;

  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        counters.forEach(animateCounter);
        activeObserver.disconnect();
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(section);
};

initCounters();
