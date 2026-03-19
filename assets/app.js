const state = {
  content: null,
  search: "",
  category: "all",
  deviceMode: "desktop",
};
const isLocalEnvironment = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

const elements = {
  hero: document.getElementById("hero"),
  homepageSections: document.getElementById("homepage-sections"),
  categoryGrid: document.getElementById("category-grid"),
  featuredGrid: document.getElementById("featured-grid"),
  postGrid: document.getElementById("post-grid"),
  postView: document.getElementById("post-view"),
  aboutStrip: document.getElementById("about-strip"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
};

async function loadContent() {
  applyDeviceMode();
  const response = await fetch("data/content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load content.");
  }

  state.content = await response.json();
  ensureHomePanels();
  hydrateFilters();
  renderPage();
}

function hydrateFilters() {
  if (!elements.categoryFilter) {
    return;
  }

  const { categories } = state.content;
  elements.categoryFilter.innerHTML = renderCategoryOptions();
  elements.categoryFilter.value = state.category;
}

function renderPage() {
  renderHero();
  renderHomepageSections();
  renderPostView();
  renderAbout();
}

function applyDeviceMode() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  state.deviceMode = isMobile ? "mobile" : "desktop";
  document.body.dataset.device = state.deviceMode;
}

function renderHero() {
  const { site } = state.content;
  const archiveCount = getPublishedPosts().length;
  document.title = site.title;
  const aboutPageHref = "/about/";
  const mobileTurtle =
    state.deviceMode === "mobile"
      ? `<img class="brand-turtle brand-turtle-mobile" src="assets/images/turtle.png" alt="" aria-hidden="true" />`
      : "";
  const desktopTurtle =
    state.deviceMode === "desktop"
      ? `
        <div class="hero-turtle-wrap" aria-hidden="true">
          <img class="brand-turtle brand-turtle-desktop" src="assets/images/turtle.png" alt="" />
        </div>
      `
      : "";
  const localOnlyActions = isLocalEnvironment
    ? `
      <div class="hero-actions">
        <a class="ghost-link" href="#archive-heading">Browse archive</a>
        <a class="pill-link" href="/editor/">Open local editor</a>
      </div>
    `
    : "";

  const hero = document.querySelector(".hero");
  hero.innerHTML = `
    ${desktopTurtle}
    <div class="hero-nav">
      <div class="brand-mark">
        <span>${escapeHtml(site.brandMark || site.title)}</span>
        ${mobileTurtle}
      </div>
      ${localOnlyActions}
    </div>
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(site.heroEyebrow || "Project journal")}</p>
      <h1>${escapeHtml(site.title)}</h1>
      <p>${escapeHtml(site.tagline)}</p>
      <p>${escapeHtml(site.intro)}</p>
      <div class="hero-actions">
        ${
          isLocalEnvironment
            ? `<a class="pill-link" href="#archive-heading">${archiveCount} posts in the archive</a>`
            : ""
        }
        <a class="ghost-link" href="${aboutPageHref}">${escapeHtml(site.contactLabel)}</a>
      </div>
    </div>
  `;
}

function renderCategories() {
  return state.content.categories
    .map(
      (category) => `
        <article class="category-card">
          <p class="eyebrow">${escapeHtml(category.id)}</p>
          <h3>${escapeHtml(category.name)}</h3>
          <p>${escapeHtml(category.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderFeaturedPosts() {
  const featuredPosts = getPublishedPosts()
    .filter((post) => post.featured)
    .sort(byNewestDate)
    .slice(0, 4);

  return featuredPosts.length
    ? featuredPosts.map(renderPostCard).join("")
    : `<p class="empty-state">Mark a post as featured in the editor to pin it here.</p>`;
}

function renderArchive() {
  const posts = getFilteredPosts();
  return posts.length
    ? posts.map(renderPostCard).join("")
    : `<p class="empty-state">No posts match the current search and filter.</p>`;
}

function renderHomepageSections() {
  const panels = (state.content.site.homepagePanels || []).filter((panel) => panel.enabled !== false);
  elements.homepageSections.innerHTML = panels
    .map((panel) => {
      if (panel.type === "category-overview") {
        return `
          <section class="section" aria-labelledby="category-heading">
            ${renderSectionHeading(panel, "category-heading")}
            <div class="category-grid">${renderCategories()}</div>
          </section>
        `;
      }

      if (panel.type === "featured-posts") {
        return `
          <section class="section" aria-labelledby="featured-heading">
            ${renderSectionHeading(panel, "featured-heading")}
            <div class="featured-grid">${renderFeaturedPosts()}</div>
          </section>
        `;
      }

      if (panel.type === "archive-posts") {
        return `
          <section class="section archive-section" aria-labelledby="archive-heading">
            <div class="section-heading archive-heading">
              <div>
                <p class="eyebrow">${escapeHtml(panel.eyebrow || "Archive")}</p>
                <h2 id="archive-heading">${escapeHtml(panel.title || "Browse everything")}</h2>
                ${panel.description ? `<p class="section-copy">${escapeHtml(panel.description)}</p>` : ""}
              </div>
              <div class="archive-controls">
                <label class="search-field">
                  <span class="visually-hidden">Search posts</span>
                  <input id="search-input" type="search" placeholder="Search title, summary, tags" value="${escapeAttribute(state.search)}" />
                </label>
                <label class="filter-field">
                  <span class="visually-hidden">Filter by category</span>
                  <select id="category-filter">${renderCategoryOptions()}</select>
                </label>
              </div>
            </div>
            <div class="post-grid">${renderArchive()}</div>
          </section>
        `;
      }

      return `
        <section class="section custom-panel" aria-labelledby="${escapeAttribute(panel.id)}-heading">
          ${renderSectionHeading(panel, `${escapeAttribute(panel.id)}-heading`)}
          <div class="custom-panel-body">${renderMarkdown(panel.body || "")}</div>
        </section>
      `;
    })
    .join("");

  elements.searchInput = document.getElementById("search-input");
  elements.categoryFilter = document.getElementById("category-filter");
  hydrateFilters();
  bindArchiveControls();
}

function renderSectionHeading(panel, headingId) {
  return `
    <div class="section-heading">
      <div>
        <p class="eyebrow">${escapeHtml(panel.eyebrow || "")}</p>
        <h2 id="${escapeAttribute(headingId)}">${escapeHtml(panel.title || "")}</h2>
        ${panel.description ? `<p class="section-copy">${escapeHtml(panel.description)}</p>` : ""}
      </div>
    </div>
  `;
}

function renderPostCard(post) {
  const categoryName = getCategoryName(post.category);
  return `
    <a class="post-card" href="?post=${encodeURIComponent(post.id)}">
      <span class="post-chip">${escapeHtml(categoryName)}</span>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.summary)}</p>
      <div class="post-meta">
        <span class="tag">${formatDate(post.date)}</span>
        ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </a>
  `;
}

function renderPostView() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post");
  if (!postId) {
    elements.postView.classList.add("hidden");
    return;
  }

  const post = getPublishedPosts().find((entry) => entry.id === postId);
  if (!post) {
    elements.postView.classList.remove("hidden");
    elements.postView.innerHTML = `
      <div class="post-nav">
        <a class="ghost-link" href="/">Back to archive</a>
      </div>
      <p class="empty-state">That post could not be found.</p>
    `;
    return;
  }

  elements.postView.classList.remove("hidden");
  elements.postView.innerHTML = `
    <div class="post-nav">
      <a class="ghost-link" href="./">Back to archive</a>
    </div>
    <p class="eyebrow">${escapeHtml(getCategoryName(post.category))}</p>
    <h2 class="post-title">${escapeHtml(post.title)}</h2>
    <div class="post-meta">
      <span class="tag">${formatDate(post.date)}</span>
      ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
    <p class="post-lead">${escapeHtml(post.summary)}</p>
    <div class="post-body">${renderPostBody(post)}</div>
  `;
}

function renderAbout() {
  const { site } = state.content;
  elements.aboutStrip.innerHTML = `
    <div class="about-copy">
      <p class="eyebrow">${escapeHtml(site.aboutEyebrow || "About this archive")}</p>
      <p>${escapeHtml(site.about)}</p>
    </div>
    <a class="pill-link" href="/about/">${escapeHtml(site.contactLabel)}</a>
  `;
}

function getFilteredPosts() {
  const query = state.search.trim().toLowerCase();
  return getPublishedPosts()
    .filter((post) => state.category === "all" || post.category === state.category)
    .filter((post) => {
      if (!query) {
        return true;
      }

      const haystack = [post.title, post.summary, ...(post.tags || []), post.body].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort(byNewestDate);
}

function getPublishedPosts() {
  return [...state.content.posts].filter((post) => post.published !== false);
}

function renderCategoryOptions() {
  return [
    `<option value="all">All categories</option>`,
    ...state.content.categories.map(
      (category) => `<option value="${escapeAttribute(category.id)}">${escapeHtml(category.name)}</option>`
    ),
  ].join("");
}

function ensureHomePanels() {
  const defaults = [
    { id: "outline", type: "category-overview", eyebrow: "Outline", title: "Four rooms, one archive.", description: "", enabled: true },
    { id: "featured", type: "featured-posts", eyebrow: "Featured", title: "Current highlights", description: "", enabled: true },
    { id: "archive", type: "archive-posts", eyebrow: "Archive", title: "Browse everything", description: "", enabled: true },
  ];
  const currentPanels = Array.isArray(state.content.site.homepagePanels) ? state.content.site.homepagePanels : [];
  const customPanels = currentPanels.filter((panel) => !defaults.some((preset) => preset.id === panel.id));
  state.content.site.homepagePanels = [
    ...defaults.map((preset) => ({ ...preset, ...currentPanels.find((panel) => panel.id === preset.id) })),
    ...customPanels,
  ];
}

function bindArchiveControls() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderHomepageSections();
    });
  }

  if (elements.categoryFilter) {
    elements.categoryFilter.addEventListener("change", (event) => {
      state.category = event.target.value;
      renderHomepageSections();
    });
  }
}

function getCategoryName(categoryId) {
  return state.content.categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

function byNewestDate(left, right) {
  return new Date(right.date) - new Date(left.date);
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderMarkdown(markdown) {
  const lines = markdown.split("\n");
  const fragments = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }
    fragments.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      fragments.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      fragments.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(escapeHtml(line.slice(2)));
      continue;
    }

    flushList();
    fragments.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  return fragments.join("");
}

function renderPostBody(post) {
  if (post.bodyFormat === "html") {
    return sanitizeRichHtml(post.body || "");
  }
  return renderMarkdown(post.body || "");
}

function sanitizeRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const disallowedTags = new Set(["script", "style", "iframe", "object", "embed", "meta", "link"]);
  const allowedStyleProps = new Set(["text-align", "color", "background-color", "font-family"]);

  const walk = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const tagName = node.tagName.toLowerCase();
    if (disallowedTags.has(tagName)) {
      node.remove();
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on")) {
        node.removeAttribute(attribute.name);
        return;
      }

      if (name === "style") {
        const safeStyles = value
          .split(";")
          .map((rule) => rule.trim())
          .filter(Boolean)
          .filter((rule) => {
            const [property, rawValue] = rule.split(":");
            if (!property || !rawValue) {
              return false;
            }

            const normalizedProperty = property.trim().toLowerCase();
            const normalizedValue = rawValue.trim().toLowerCase();
            return (
              allowedStyleProps.has(normalizedProperty) &&
              !normalizedValue.includes("url(") &&
              !normalizedValue.includes("expression")
            );
          });

        if (safeStyles.length) {
          node.setAttribute("style", safeStyles.join("; "));
        } else {
          node.removeAttribute("style");
        }
        return;
      }

      if (tagName === "img" && name === "src") {
        const safeSource =
          value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
        if (!safeSource) {
          node.removeAttribute(attribute.name);
        }
        return;
      }

      if ((name === "src" || name === "href") && value.trim().toLowerCase().startsWith("javascript:")) {
        node.removeAttribute(attribute.name);
      }
    });

    [...node.childNodes].forEach(walk);
  };

  [...template.content.childNodes].forEach(walk);
  return template.innerHTML;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

loadContent().catch((error) => {
  document.body.innerHTML = `<main class="page-shell"><section class="section"><p class="empty-state">${escapeHtml(
    error.message
  )}</p></section></main>`;
});

window.addEventListener("resize", () => {
  applyDeviceMode();
});
