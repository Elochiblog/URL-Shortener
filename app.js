(function () {
  "use strict";

  const urlInput = document.getElementById("url-input");
  const urlError = document.getElementById("url-error");
  const shortenBtn = document.getElementById("shorten-btn");
  const resultsList = document.getElementById("results-list");

  const STORAGE_KEY = "shortly_results";
  let history = [];

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) history = JSON.parse(stored);
  } catch (_) {}

  if (history.length) {
    history.forEach(({ original, short }) =>
      renderResult(original, short, false)
    );
  }

  function isValidUrl(str) {
    try {
      const { protocol } = new URL(str);
      return protocol === "http:" || protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function showError(msg) {
    urlInput.classList.add("is-invalid");
    urlError.textContent = msg;
    urlError.classList.add("visible");
  }

  function clearError() {
    urlInput.classList.remove("is-invalid");
    urlError.classList.remove("visible");
  }

  async function shortenUrl(longUrl) {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
    );
    if (!res.ok) throw new Error("API error");
    return (await res.text()).trim();
  }

  function renderResult(originalUrl, shortUrl, prepend = true) {
    const item = document.createElement("div");
    item.className = "result-item";
    item.setAttribute("role", "listitem");

    item.innerHTML = `
      <span class="result-original" title="${escHtml(originalUrl)}">${escHtml(
      originalUrl
    )}</span>
      <hr class="result-divider">
      <div class="result-right">
        <a href="${escHtml(
          shortUrl
        )}" class="result-short" target="_blank" rel="noopener noreferrer">${escHtml(
      shortUrl
    )}</a>
        <button class="btn-primary-teal btn-copy" data-url="${escHtml(
          shortUrl
        )}" type="button">Copy</button>
      </div>
    `;

    item.querySelector(".btn-copy").addEventListener("click", handleCopy);

    if (prepend && resultsList.firstChild) {
      resultsList.insertBefore(item, resultsList.firstChild);
    } else {
      resultsList.appendChild(item);
    }
  }

  function handleCopy(e) {
    const btn = e.currentTarget;

    document.querySelectorAll(".btn-copy.copied").forEach((b) => {
      if (b !== btn) {
        b.textContent = "Copy";
        b.classList.remove("copied");
      }
    });

    const write = () => {
      btn.textContent = "Copied!";
      btn.classList.add("copied");
    };

    navigator.clipboard
      .writeText(btn.dataset.url)
      .then(write)
      .catch(() => {
        const ta = Object.assign(document.createElement("textarea"), {
          value: btn.dataset.url,
          style: "position:fixed;opacity:0",
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        write();
      });
  }

  async function handleShorten() {
    const raw = urlInput.value.trim();

    if (!raw) {
      showError("Please add a link");
      urlInput.focus();
      return;
    }

    if (!isValidUrl(raw)) {
      showError("Please add a valid link (include https://)");
      urlInput.focus();
      return;
    }

    clearError();
    shortenBtn.disabled = true;
    shortenBtn.innerHTML = `<span class="spinner-border spinner-border-sm spinner-border-sm-custom me-2" role="status" aria-hidden="true"></span>Loading...`;

    try {
      const shortUrl = await shortenUrl(raw);

      history.unshift({ original: raw, short: shortUrl });
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (_) {}

      renderResult(raw, shortUrl, true);
      urlInput.value = "";
      urlInput.focus();
    } catch (_) {
      showError("Something went wrong. Please try again.");
    } finally {
      shortenBtn.disabled = false;
      shortenBtn.textContent = "Shorten It!";
    }
  }

  shortenBtn.addEventListener("click", handleShorten);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleShorten();
  });
  urlInput.addEventListener("input", () => {
    if (urlInput.classList.contains("is-invalid")) clearError();
  });

  function escHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
