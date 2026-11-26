document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("ano-atual");
  if (year) year.textContent = String(new Date().getFullYear());

  const sections = [...document.querySelectorAll("main section[id]")];
  const links = [...document.querySelectorAll(".nav-links a")];
  if (!sections.length || !links.length) return;

  let scheduled = false;
  const updateActiveLink = () => {
    scheduled = false;
    const current = sections.reduce((active, section) => {
      return section.getBoundingClientRect().top <= 170 ? section.id : active;
    }, "");

    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateActiveLink);
  };

  updateActiveLink();
  document.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
});
