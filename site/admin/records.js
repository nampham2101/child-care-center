// Records: list entries with category and date-range filters.
(function () {
  var form, body, summaryEl, emptyEl;

  function fmt(n) {
    return "$" + Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function iso(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function cell(text, className) {
    var td = document.createElement("td");
    td.textContent = text;
    if (className) td.className = className;
    return td;
  }

  function renderSummary(entries) {
    var income = 0;
    var expense = 0;
    entries.forEach(function (e) {
      var a = Number(e.amount) || 0;
      if (e.type === "income") income += a;
      else expense += a;
    });
    summaryEl.textContent =
      entries.length +
      (entries.length === 1 ? " entry" : " entries") +
      " · Income " + fmt(income) +
      " · Expenses " + fmt(expense) +
      " · Profit " + fmt(income - expense);
  }

  function render(entries) {
    body.innerHTML = "";
    if (!entries.length) {
      emptyEl.hidden = false;
    } else {
      emptyEl.hidden = true;
      entries.forEach(function (e) {
        var typeClass = e.type === "income" ? "type-income" : "type-expense";
        var tr = document.createElement("tr");
        tr.appendChild(cell(e.date));
        tr.appendChild(cell(e.type === "income" ? "Income" : "Expense", typeClass));
        tr.appendChild(cell(e.category));
        tr.appendChild(cell(fmt(e.amount), "num " + typeClass));
        tr.appendChild(cell(e.note || "—"));
        body.appendChild(tr);
      });
    }
    renderSummary(entries);
  }

  function currentFilters() {
    return {
      category: form.category.value.trim(),
      from: form.from.value,
      to: form.to.value,
    };
  }

  async function load() {
    summaryEl.textContent = "Loading…";
    try {
      var entries = await adminApi.getEntries(currentFilters());
      render(entries);
    } catch (err) {
      summaryEl.textContent = "Couldn't load records: " + err.message;
      body.innerHTML = "";
      emptyEl.hidden = true;
    }
  }

  function thisMonth() {
    var now = new Date();
    form.from.value = iso(new Date(now.getFullYear(), now.getMonth(), 1));
    form.to.value = iso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    load();
  }

  function clearFilters() {
    form.reset();
    load();
  }

  function wire() {
    form = document.getElementById("filter-form");
    body = document.getElementById("records-body");
    summaryEl = document.getElementById("records-summary");
    emptyEl = document.getElementById("records-empty");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      load();
    });
    document.getElementById("this-month").addEventListener("click", thisMonth);
    document.getElementById("clear-filters").addEventListener("click", clearFilters);
  }

  // Only load once BOTH the DOM is wired and a session exists — the Identity
  // "init" event can fire before or after DOMContentLoaded, so we gate on both
  // rather than assuming an order.
  var domReady = false;
  var hasSession = false;

  function maybeLoad() {
    if (domReady && hasSession) load();
  }

  function onDomReady() {
    wire();
    domReady = true;
    // Covers the case where Identity already initialized before this ran.
    if (window.netlifyIdentity && netlifyIdentity.currentUser()) hasSession = true;
    maybeLoad();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDomReady);
  } else {
    onDomReady();
  }

  if (window.netlifyIdentity) {
    netlifyIdentity.on("init", function (user) {
      if (user) { hasSession = true; maybeLoad(); }
    });
    netlifyIdentity.on("login", function () {
      hasSession = true;
      maybeLoad();
    });
  }
})();
