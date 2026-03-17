const state = {
  content: null,
  search: "",
  category: "all",
};
const isLocalEnvironment = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

const elements = {
  hero: document.getElementById("hero"),
  categoryGrid: document.getElementById("category-grid"),
  featuredGrid: document.getElementById("featured-grid"),
  postGrid: document.getElementById("post-grid"),
  postView: document.getElementById("post-view"),
  aboutStrip: document.getElementById("about-strip"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
};

async function loadContent() {
  const response = await fetch("data/content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load content.");
  }

  state.content = await response.json();
  hydrateFilters();
  renderPage();
}

function hydrateFilters() {
  const { categories } = state.content;
  elements.categoryFilter.innerHTML = [
    `<option value="all">All categories</option>`,
    ...categories.map((category) => `<option value="${category.id}">${category.name}</option>`),
  ].join("");
}

function renderPage() {
  renderHero();
  renderCategories();
  renderFeaturedPosts();
  renderArchive();
  renderPostView();
  renderAbout();
}

function renderHero() {
  const { site } = state.content;
  const archiveCount = state.content.posts.length;
  document.title = site.title;
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
    <div class="hero-nav">
      <div class="brand-mark">Blue Shell Almanac</div>
      ${localOnlyActions}
    </div>
    <div class="hero-copy">
      <p class="eyebrow">Project journal</p>
      <h1>${escapeHtml(site.title)}</h1>
      <p>${escapeHtml(site.tagline)}</p>
      <p>${escapeHtml(site.intro)}</p>
      <div class="hero-actions">
        ${
          isLocalEnvironment
            ? `<a class="pill-link" href="#archive-heading">${archiveCount} posts in the archive</a>`
            : ""
        }
        <a class="ghost-link" href="${escapeAttribute(site.contactHref)}">${escapeHtml(site.contactLabel)}</a>
      </div>
    </div>
  `;
}

function renderCategories() {
  elements.categoryGrid.innerHTML = state.content.categories
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
  const featuredPosts = [...state.content.posts]
    .filter((post) => post.featured)
    .sort(byNewestDate)
    .slice(0, 4);

  elements.featuredGrid.innerHTML = featuredPosts.length
    ? featuredPosts.map(renderPostCard).join("")
    : `<p class="empty-state">Mark a post as featured in the editor to pin it here.</p>`;
}

function renderArchive() {
  const posts = getFilteredPosts();
  elements.postGrid.innerHTML = posts.length
    ? posts.map(renderPostCard).join("")
    : `<p class="empty-state">No posts match the current search and filter.</p>`;
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

  const post = state.content.posts.find((entry) => entry.id === postId);
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
    <div class="post-body">${renderMarkdown(post.body)}</div>
  `;
}

function renderAbout() {
  const { site } = state.content;
  elements.aboutStrip.innerHTML = `
    <div class="about-copy">
      <p class="eyebrow">About this archive</p>
      <p>${escapeHtml(site.about)}</p>
    </div>
    <a class="pill-link" href="${escapeAttribute(site.contactHref)}">${escapeHtml(site.contactLabel)}</a>
  `;
}

function getFilteredPosts() {
  const query = state.search.trim().toLowerCase();
  return [...state.content.posts]
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

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderArchive();
});

elements.categoryFilter.addEventListener("change", (event) => {
  state.category = event.target.value;
  renderArchive();
});

loadContent().catch((error) => {
  document.body.innerHTML = `<main class="page-shell"><section class="section"><p class="empty-state">${escapeHtml(
    error.message
  )}</p></section></main>`;
});
