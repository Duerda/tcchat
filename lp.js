document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("ativo");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
  elements.forEach((element) => observer.observe(element));

  const sections = [...document.querySelectorAll("main section[id], .site-header")];
  const links = [...document.querySelectorAll(".nav-links a")];
  const updateActiveLink = () => {
    const current = sections.reduce((active, section) => {
      return section.getBoundingClientRect().top <= 130 ? section.id : active;
    }, "inicio");
    links.forEach((link) => link.classList.toggle("ativo", link.getAttribute("href") === `#${current}`));
  };
  updateActiveLink();
  document.addEventListener("scroll", updateActiveLink, { passive: true });
});
