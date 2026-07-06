window.CCA = window.CCA || {};

window.CCA.navigation = (() => {
  const pageTitles = {
    landing: "Landing Dashboard",
    executive: "Executive Dashboard",
    campaign: "Campaign Dashboard",
    operations: "Operations Dashboard",
    history: "History",
    settings: "Settings"
  };

  function init(onPageChange) {
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");
    const title = document.getElementById("pageTitle");
    const breadcrumb = document.getElementById("breadcrumb");
    const sidebar = document.getElementById("sidebar");
    const mobileMenu = document.getElementById("mobileMenu");
    const collapseSidebar = document.getElementById("collapseSidebar");

    function navigateTo(page) {
      const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);

      navItems.forEach((nav) => nav.classList.toggle("active", nav === activeItem));
      views.forEach((view) => view.classList.toggle("active", view.dataset.view === page));

      title.textContent = pageTitles[page];
      breadcrumb.textContent = `Analytics / ${pageTitles[page]}`;
      sidebar.classList.remove("open");

      if (typeof onPageChange === "function") {
        onPageChange(page);
      }
    }

    navItems.forEach((item) => {
      item.addEventListener("click", () => navigateTo(item.dataset.page));
    });

    mobileMenu.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    collapseSidebar.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-collapsed");
    });

    return { navigateTo };
  }

  return { init };
})();
