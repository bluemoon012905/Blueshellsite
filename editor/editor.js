const editorState = {
  content: null,
  selectedPostId: null,
  search: "",
};
const isLocalEnvironment = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

const fields = {
  status: document.getElementById("status-message"),
  postList: document.getElementById("post-list"),
  postSearch: document.getElementById("post-search"),
  newPostButton: document.getElementById("new-post-button"),
  saveButton: document.getElementById("save-button"),
  exportButton: document.getElementById("export-button"),
  deletePostButton: document.getElementById("delete-post-button"),
  siteTitle: document.getElementById("site-title"),
  siteTagline: document.getElementById("site-tagline"),
  siteIntro: document.getElementById("site-intro"),
  siteAbout: document.getElementById("site-about"),
  brandMark: document.getElementById("brand-mark"),
  heroEyebrow: document.getElementById("hero-eyebrow"),
  aboutEyebrow: document.getElementById("about-eyebrow"),
  contactLabel: document.getElementById("contact-label"),
  contactHref: document.getElementById("contact-href"),
  editorEyebrow: document.getElementById("editor-eyebrow"),
  editorTitle: document.getElementById("editor-title"),
  editorDescription: document.getElementById("editor-description"),
  editorEyebrowDisplay: document.getElementById("editor-eyebrow-display"),
  editorTitleDisplay: document.getElementById("editor-title-display"),
  editorDescriptionDisplay: document.getElementById("editor-description-display"),
  categoryFields: document.getElementById("category-fields"),
  postEditor: document.getElementById("post-editor"),
  postEditorHeading: document.getElementById("post-editor-heading"),
  postPreview: document.getElementById("post-preview"),
  openPublicPostLink: document.getElementById("open-public-post-link"),
  postId: document.getElementById("post-id"),
  postTitle: document.getElementById("post-title"),
  postCategory: document.getElementById("post-category"),
  postDate: document.getElementById("post-date"),
  postTags: document.getElementById("post-tags"),
  postFeatured: document.getElementById("post-featured"),
  postSummary: document.getElementById("post-summary"),
  postBody: document.getElementById("post-body"),
};

async function initEditor() {
  if (!isLocalEnvironment) {
    document.body.innerHTML = `
      <main class="editor-main">
        <section class="panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">Local editor</p>
              <h2>Unavailable here</h2>
            </div>
          </div>
          <p>This editor is intentionally only enabled on a local run of the site.</p>
          <p>Start the local server with <code>npm run dev</code>, then open <code>http://localhost:4321/editor/</code>.</p>
          <a href="/" class="text-link" style="color: var(--ink); border-color: var(--line);">Back to public site</a>
        </section>
      </main>
    `;
    return;
  }

  const response = await fetch("/api/content", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load editable content. Start the local server with `npm run dev`.");
  }

  editorState.content = await response.json();
  populateSiteFields();
  populateCategoryFields();
  populateCategorySelect();

  const firstPost = [...editorState.content.posts].sort(byNewestDate)[0];
  if (firstPost) {
    selectPost(firstPost.id);
  }

  renderPostList();
  setStatus("Loaded local content");
}

function populateSiteFields() {
  const { site } = editorState.content;
  fields.siteTitle.value = site.title;
  fields.siteTagline.value = site.tagline;
  fields.siteIntro.value = site.intro;
  fields.siteAbout.value = site.about;
  fields.brandMark.value = site.brandMark || "";
  fields.heroEyebrow.value = site.heroEyebrow || "";
  fields.aboutEyebrow.value = site.aboutEyebrow || "";
  fields.contactLabel.value = site.contactLabel;
  fields.contactHref.value = site.contactHref;
  fields.editorEyebrow.value = site.editorEyebrow || "";
  fields.editorTitle.value = site.editorTitle || "";
  fields.editorDescription.value = site.editorDescription || "";
  renderEditorSidebarCopy();
}

function populateCategoryFields() {
  fields.categoryFields.innerHTML = editorState.content.categories
    .map(
      (category, index) => `
        <div class="category-card">
          <label>
            <span>Category ID</span>
            <input data-category-index="${index}" data-key="id" type="text" value="${escapeHtml(category.id)}" />
          </label>
          <label>
            <span>Name</span>
            <input data-category-index="${index}" data-key="name" type="text" value="${escapeHtml(category.name)}" />
          </label>
          <label>
            <span>Description</span>
            <textarea data-category-index="${index}" data-key="description" rows="4">${escapeHtml(
              category.description
            )}</textarea>
          </label>
        </div>
      `
    )
    .join("");
}

function populateCategorySelect() {
  fields.postCategory.innerHTML = editorState.content.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");
}

function renderPostList() {
  const posts = [...editorState.content.posts]
    .filter((post) => {
      const query = editorState.search.trim().toLowerCase();
      if (!query) {
        return true;
      }
      return [post.title, post.summary, ...(post.tags || [])].join(" ").toLowerCase().includes(query);
    })
    .sort(byNewestDate);

  fields.postList.innerHTML = posts
    .map(
      (post) => `
        <button type="button" class="post-item ${post.id === editorState.selectedPostId ? "active" : ""}" data-post-id="${post.id}">
          <strong>${escapeHtml(post.title)}</strong>
          <span>${escapeHtml(getCategoryName(post.category))} • ${escapeHtml(post.date)}</span>
        </button>
      `
    )
    .join("");
}

function selectPost(postId) {
  const post = editorState.content.posts.find((entry) => entry.id === postId);
  if (!post) {
    editorState.selectedPostId = null;
    fields.postEditor.classList.add("hidden");
    fields.postPreview.classList.add("hidden");
    fields.openPublicPostLink.href = "/";
    fields.postEditorHeading.textContent = "Select or create a post";
    renderPostList();
    return;
  }

  editorState.selectedPostId = post.id;
  fields.postEditor.classList.remove("hidden");
  fields.postEditorHeading.textContent = post.title || "Untitled post";

  fields.postId.value = post.id;
  fields.postTitle.value = post.title;
  fields.postCategory.value = post.category;
  fields.postDate.value = post.date;
  fields.postTags.value = (post.tags || []).join(", ");
  fields.postFeatured.checked = Boolean(post.featured);
  fields.postSummary.value = post.summary;
  fields.postBody.value = post.body;

  renderPostPreview(post);
  renderPostList();
}

function syncSiteFields() {
  const { site } = editorState.content;
  site.title = fields.siteTitle.value.trim();
  site.tagline = fields.siteTagline.value.trim();
  site.intro = fields.siteIntro.value.trim();
  site.about = fields.siteAbout.value.trim();
  site.brandMark = fields.brandMark.value.trim();
  site.heroEyebrow = fields.heroEyebrow.value.trim();
  site.aboutEyebrow = fields.aboutEyebrow.value.trim();
  site.contactLabel = fields.contactLabel.value.trim();
  site.contactHref = fields.contactHref.value.trim();
  site.editorEyebrow = fields.editorEyebrow.value.trim();
  site.editorTitle = fields.editorTitle.value.trim();
  site.editorDescription = fields.editorDescription.value.trim();
  renderEditorSidebarCopy();
}

function syncCategoryFields() {
  const previousIds = editorState.content.categories.map((category) => category.id);
  const inputs = fields.categoryFields.querySelectorAll("[data-category-index]");
  inputs.forEach((input) => {
    const categoryIndex = Number(input.dataset.categoryIndex);
    const key = input.dataset.key;
    editorState.content.categories[categoryIndex][key] = input.value.trim();
  });

  editorState.content.categories.forEach((category, index) => {
    const oldId = previousIds[index];
    if (!oldId || oldId === category.id) {
      return;
    }

    editorState.content.posts.forEach((post) => {
      if (post.category === oldId) {
        post.category = category.id;
      }
    });
  });
}

function syncCurrentPost() {
  if (!editorState.selectedPostId) {
    return;
  }

  const post = editorState.content.posts.find((entry) => entry.id === editorState.selectedPostId);
  if (!post) {
    return;
  }

  post.id = slugify(fields.postId.value);
  post.title = fields.postTitle.value.trim();
  post.category = fields.postCategory.value;
  post.date = fields.postDate.value;
  post.tags = fields.postTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  post.featured = fields.postFeatured.checked;
  post.summary = fields.postSummary.value.trim();
  post.body = fields.postBody.value.trim();

  editorState.selectedPostId = post.id;
  fields.postEditorHeading.textContent = post.title || "Untitled post";
  renderPostPreview(post);
}

function createPost() {
  syncAllFields();
  const baseTitle = "new-post";
  let nextId = baseTitle;
  let suffix = 1;
  while (editorState.content.posts.some((post) => post.id === nextId)) {
    suffix += 1;
    nextId = `${baseTitle}-${suffix}`;
  }

  editorState.content.posts.unshift({
    id: nextId,
    title: "Untitled post",
    category: editorState.content.categories[0]?.id || "personal",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    featured: false,
    tags: [],
    body: "## Start here\n\nWrite the first draft of this post.",
  });

  populateCategorySelect();
  selectPost(nextId);
  setStatus("Created a new post draft");
}

function deleteCurrentPost() {
  if (!editorState.selectedPostId) {
    return;
  }

  const remainingPosts = editorState.content.posts.filter((post) => post.id !== editorState.selectedPostId);
  editorState.content.posts = remainingPosts;
  const nextPost = [...remainingPosts].sort(byNewestDate)[0];
  selectPost(nextPost?.id ?? null);
  setStatus("Deleted the selected post");
}

function syncAllFields() {
  syncSiteFields();
  syncCategoryFields();
  syncCurrentPost();
  populateCategorySelect();
  renderPostList();
}

async function saveAllChanges() {
  syncAllFields();
  setStatus("Saving...");
  const response = await fetch("/api/content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(editorState.content, null, 2),
  });

  if (!response.ok) {
    throw new Error("Save failed.");
  }

  setStatus("Saved to data/content.json");
}

function exportBackup() {
  syncAllFields();
  const blob = new Blob([JSON.stringify(editorState.content, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "blue-shell-almanac-backup.json";
  link.click();
  URL.revokeObjectURL(href);
  setStatus("Exported JSON backup");
}

function setStatus(message) {
  fields.status.textContent = message;
}

function renderPostPreview(post) {
  fields.postPreview.classList.remove("hidden");
  fields.openPublicPostLink.href = `/?post=${encodeURIComponent(post.id)}`;
  fields.postPreview.innerHTML = `
    <p class="eyebrow">${escapeHtml(getCategoryName(post.category))}</p>
    <h3 class="preview-title">${escapeHtml(post.title || "Untitled post")}</h3>
    <div class="preview-meta">
      <span class="preview-chip">${escapeHtml(formatDate(post.date || new Date().toISOString().slice(0, 10)))}</span>
      ${post.featured ? `<span class="preview-chip">Featured</span>` : ""}
    </div>
    <p class="preview-summary">${escapeHtml(post.summary || "Add a summary to preview the lead text here.")}</p>
    <div class="preview-tags">
      ${
        (post.tags || []).length
          ? post.tags.map((tag) => `<span class="preview-tag">${escapeHtml(tag)}</span>`).join("")
          : `<span class="preview-tag">No tags yet</span>`
      }
    </div>
    <div class="preview-body">${renderMarkdown(post.body || "## Start here")}</div>
  `;
}

function renderEditorSidebarCopy() {
  const { site } = editorState.content;
  fields.editorEyebrowDisplay.textContent = site.editorEyebrow || "Local editor";
  fields.editorTitleDisplay.textContent = site.editorTitle || site.title || "Blue Shell Almanac";
  fields.editorDescriptionDisplay.textContent =
    site.editorDescription || "Manage site copy and posts here. Saving writes directly to data/content.json.";
}

function getCategoryName(categoryId) {
  return editorState.content.categories.find((category) => category.id === categoryId)?.name ?? categoryId;
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

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "untitled-post";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

fields.postSearch.addEventListener("input", (event) => {
  editorState.search = event.target.value;
  renderPostList();
});

[
  fields.siteTitle,
  fields.siteTagline,
  fields.siteIntro,
  fields.siteAbout,
  fields.brandMark,
  fields.heroEyebrow,
  fields.aboutEyebrow,
  fields.contactLabel,
  fields.contactHref,
  fields.editorEyebrow,
  fields.editorTitle,
  fields.editorDescription,
].forEach((field) => {
  field.addEventListener("input", () => {
    syncSiteFields();
  });
});

[
  fields.postId,
  fields.postTitle,
  fields.postCategory,
  fields.postDate,
  fields.postTags,
  fields.postSummary,
  fields.postBody,
].forEach((field) => {
  field.addEventListener("input", () => {
    syncCurrentPost();
    renderPostList();
  });
});

fields.postFeatured.addEventListener("change", () => {
  syncCurrentPost();
  renderPostList();
});

fields.postCategory.addEventListener("change", () => {
  syncCurrentPost();
  renderPostList();
});

fields.postList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-post-id]");
  if (!button) {
    return;
  }
  syncAllFields();
  selectPost(button.dataset.postId);
});

fields.newPostButton.addEventListener("click", () => {
  createPost();
});

fields.deletePostButton.addEventListener("click", () => {
  deleteCurrentPost();
});

fields.exportButton.addEventListener("click", () => {
  exportBackup();
});

fields.saveButton.addEventListener("click", async () => {
  try {
    await saveAllChanges();
  } catch (error) {
    setStatus(error.message);
  }
});

initEditor().catch((error) => {
  fields.status.textContent = error.message;
});
