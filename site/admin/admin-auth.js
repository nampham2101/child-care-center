// Shared Identity gate for logged-in admin pages (index.html, records.html).
// Redirects to login.html if there's no valid session on init or on logout.
(function () {
  netlifyIdentity.on("init", function (user) {
    if (!user) {
      window.location.href = "login.html";
    }
  });

  netlifyIdentity.on("logout", function () {
    window.location.href = "login.html";
  });

  netlifyIdentity.init();

  document.addEventListener("DOMContentLoaded", function () {
    var logoutBtn = document.querySelector("[data-logout]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        netlifyIdentity.logout();
      });
    }
  });
})();
