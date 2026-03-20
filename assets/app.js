const {
  DEFAULT_HOME_PANELS,
  ensureHomePanels: ensureContentHomePanels,
  byNewestDate,
  formatDate,
  renderMarkdown,
  sanitizeRichHtml,
  escapeHtml,
  escapeAttribute,
} = window.BlueshellContent;

const state = {
  content: null,
  search: "",
  category: "all",
  deviceMode: "desktop",
  turtleFlipped: false,
  turtleImageSrc: "assets/images/turtle.png",
  turtleSpinDuration: 10,
};
const isLocalEnvironment = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const DEFAULT_TURTLE_IMAGE = "assets/images/turtle.png";
const TURTLE_VARIANTS_DIR = "/assets/images/turtle-variants/";
const STATIC_TURTLE_VARIANTS = [
  "assets/images/turtle-variants/turtle_100.png",
  "assets/images/turtle-variants/turtle_book.png",
  "assets/images/turtle-variants/turtle_cheese.png",
  "assets/images/turtle-variants/turtle_chicken.png",
  "assets/images/turtle-variants/turtle_cowboy.png",
  "assets/images/turtle-variants/turtle_explode.png",
  "assets/images/turtle-variants/turtle_fishing.png",
  "assets/images/turtle-variants/turtle_fortune.png",
  "assets/images/turtle-variants/turtle_frog.png",
  "assets/images/turtle-variants/turtle_glasses.png",
  "assets/images/turtle-variants/turtle_headphone.png",
  "assets/images/turtle-variants/turtle_infinity.png",
  "assets/images/turtle-variants/turtle_melon.png",
  "assets/images/turtle-variants/turtle_moon.png",
  "assets/images/turtle-variants/turtle_poop.png",
  "assets/images/turtle-variants/turtle_scholar.png",
  "assets/images/turtle-variants/turtle_scropion.png",
  "assets/images/turtle-variants/turtle_sprial.png",
  "assets/images/turtle-variants/turtle_volleyball.png",
];

const elements = {
  hero: document.getElementById("hero"),
  homepageSections: document.getElementById("homepage-sections"),
  categoryGrid: document.getElementById("category-grid"),
  featuredGrid: document.getElementById("featured-grid"),
  postGrid: document.getElementById("post-grid"),
  aboutStrip: document.getElementById("about-strip"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
};

async function loadContent() {
  applyDeviceMode();
  await initializeTurtleAppearance();
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
  renderAbout();
}

function applyDeviceMode() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  state.deviceMode = isMobile ? "mobile" : "desktop";
  document.body.dataset.device = state.deviceMode;
}

async function initializeTurtleAppearance() {
  const useVariant = Math.random() < 0.2;
  // const isFastSpin = Math.random() < 0.2;
  const turtleVariants = await discoverTurtleVariants();
  state.turtleImageSrc =
    useVariant && turtleVariants.length ? pickRandom(turtleVariants) : DEFAULT_TURTLE_IMAGE;
  // state.turtleSpinDuration = isFastSpin ? randomBetween(0.9, 2.4) : randomBetween(8.5, 13.5);
  state.turtleSpinDuration = 10;
}

async function discoverTurtleVariants() {
  try {
    const response = await fetch("/api/image-assets", { cache: "no-store" });
    if (!response.ok) {
      return STATIC_TURTLE_VARIANTS;
    }

    const payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.assets)) {
      return STATIC_TURTLE_VARIANTS;
    }

    const apiVariants = payload.assets
      .map((asset) => asset.path)
      .filter((path) => typeof path === "string" && path.startsWith(TURTLE_VARIANTS_DIR))
      .map((path) => path.slice(1));

    return apiVariants.length ? apiVariants : STATIC_TURTLE_VARIANTS;
  } catch {
    return STATIC_TURTLE_VARIANTS;
  }
}

function renderHero() {
  const { site } = state.content;
  const archiveCount = getPublishedPosts().length;
  document.title = site.title;
  const aboutPageHref = "/about/";
  const turtleFlipClass = state.turtleFlipped ? " is-flipped" : "";
  const turtleSpinStyle = `style="--spin-duration: ${state.turtleSpinDuration.toFixed(2)}s;"`;
  const mobileTurtle =
    state.deviceMode === "mobile"
      ? `<button class="turtle-button turtle-button-mobile" type="button" aria-label="Flip turtle">
          <span class="turtle-spin" ${turtleSpinStyle} aria-hidden="true">
            <img class="brand-turtle brand-turtle-mobile${turtleFlipClass}" src="${state.turtleImageSrc}" alt="" />
          </span>
        </button>`
      : "";
  const desktopTurtle =
    state.deviceMode === "desktop"
      ? `
        <button class="hero-turtle-wrap turtle-button" type="button" aria-label="Flip turtle">
          <span class="turtle-spin" ${turtleSpinStyle} aria-hidden="true">
            <img class="brand-turtle brand-turtle-desktop${turtleFlipClass}" src="${state.turtleImageSrc}" alt="" />
          </span>
        </button>
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
  bindTurtleFlip();
}

function bindTurtleFlip() {
  const turtleButton = document.querySelector(".turtle-button");
  if (!turtleButton) {
    return;
  }

  turtleButton.addEventListener("click", () => {
    state.turtleFlipped = !state.turtleFlipped;
    renderHero();
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function renderCategories() {
  return state.content.categories
    .map(
      (category) => `
        <a class="category-card" href="/category/?category=${encodeURIComponent(category.id)}">
          <p class="eyebrow">${escapeHtml(category.id)}</p>
          <h3>${escapeHtml(category.name)}</h3>
          <p>${escapeHtml(category.description)}</p>
        </a>
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
    <a class="post-card" href="/post/?post=${encodeURIComponent(post.id)}">
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
  ensureContentHomePanels(state.content, DEFAULT_HOME_PANELS);
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

function renderPostBody(post) {
  if (post.bodyFormat === "html") {
    return sanitizeRichHtml(post.body || "");
  }
  return renderMarkdown(post.body || "");
}

loadContent().catch((error) => {
  document.body.innerHTML = `<main class="page-shell"><section class="section"><p class="empty-state">${escapeHtml(
    error.message
  )}</p></section></main>`;
});

window.addEventListener("resize", () => {
  applyDeviceMode();
});
