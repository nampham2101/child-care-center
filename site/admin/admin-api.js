// Shared client for the admin Netlify Functions. Sends the Netlify Identity JWT
// explicitly in the Authorization header so auth works both on the deployed site
// and under local `netlify dev`.
window.adminApi = (function () {
  async function authHeaders() {
    var user = window.netlifyIdentity && netlifyIdentity.currentUser();
    if (!user) {
      throw new Error("You are not logged in.");
    }
    var token = await user.jwt();
    return { Authorization: "Bearer " + token };
  }

  async function request(url, options) {
    var res = await fetch(url, options);
    var data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      var msg = data && data.error ? data.error : "Request failed (" + res.status + ")";
      throw new Error(msg);
    }
    return data;
  }

  async function addEntry(entry) {
    var headers = await authHeaders();
    headers["Content-Type"] = "application/json";
    return request("/.netlify/functions/add-entry", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(entry),
    });
  }

  async function getEntries(filters) {
    var headers = await authHeaders();
    var params = new URLSearchParams();
    if (filters) {
      if (filters.category) params.set("category", filters.category);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
    }
    var qs = params.toString();
    return request("/.netlify/functions/get-entries" + (qs ? "?" + qs : ""), {
      headers: headers,
      cache: "no-store",
    });
  }

  return { addEntry: addEntry, getEntries: getEntries };
})();
