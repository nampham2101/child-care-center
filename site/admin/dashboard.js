// Dashboard: add income/expense entries and show running totals.
(function () {
  var form, statusEl, incomeEl, expenseEl, profitEl;

  function fmt(n) {
    return "$" + Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function computeTotals(entries) {
    var income = 0;
    var expense = 0;
    entries.forEach(function (e) {
      var amt = Number(e.amount) || 0;
      if (e.type === "income") income += amt;
      else if (e.type === "expense") expense += amt;
    });
    return { income: income, expense: expense, profit: income - expense };
  }

  async function refreshTotals() {
    if (!incomeEl) return;
    try {
      var entries = await adminApi.getEntries();
      var t = computeTotals(entries);
      incomeEl.textContent = fmt(t.income);
      expenseEl.textContent = fmt(t.expense);
      profitEl.textContent = fmt(t.profit);
      profitEl.classList.toggle("is-negative", t.profit < 0);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Couldn't load totals: " + err.message;
        statusEl.className = "form-note status-error";
      }
    }
  }

  function setToday() {
    if (form && form.date) {
      form.date.value = new Date().toISOString().slice(0, 10);
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    var btn = form.querySelector("button[type=submit]");
    statusEl.textContent = "";
    statusEl.className = "form-note";

    var payload = {
      type: form.type.value,
      amount: form.amount.value,
      category: form.category.value.trim(),
      date: form.date.value,
      note: form.note.value.trim(),
    };

    btn.disabled = true;
    try {
      await adminApi.addEntry(payload);
      statusEl.textContent = "Entry added.";
      statusEl.className = "form-note status-ok";
      form.reset();
      setToday();
      await refreshTotals();
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.className = "form-note status-error";
    } finally {
      btn.disabled = false;
    }
  }

  function wireForm() {
    form = document.getElementById("entry-form");
    statusEl = document.getElementById("form-status");
    incomeEl = document.getElementById("total-income");
    expenseEl = document.getElementById("total-expense");
    profitEl = document.getElementById("total-profit");
    if (form) {
      setToday();
      form.addEventListener("submit", onSubmit);
    }
  }

  // Only load totals once BOTH the DOM is wired and a session exists — the
  // Identity "init" event can fire before or after DOMContentLoaded, so we gate
  // on both rather than assuming an order.
  var domReady = false;
  var hasSession = false;

  function maybeRefresh() {
    if (domReady && hasSession) refreshTotals();
  }

  function onDomReady() {
    wireForm();
    domReady = true;
    // Covers the case where Identity already initialized before this ran.
    if (window.netlifyIdentity && netlifyIdentity.currentUser()) hasSession = true;
    maybeRefresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDomReady);
  } else {
    onDomReady();
  }

  if (window.netlifyIdentity) {
    netlifyIdentity.on("init", function (user) {
      if (user) { hasSession = true; maybeRefresh(); }
    });
    netlifyIdentity.on("login", function () {
      hasSession = true;
      maybeRefresh();
    });
  }
})();
