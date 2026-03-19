const editorState = {
  content: null,
  selectedPostId: null,
  search: "",
  composerOpen: false,
  savedSelection: null,
};

const isLocalEnvironment = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

const fields = {
  status: document.getElementById("status-message"),
  postList: document.getElementById("post-list"),
  postSearch: document.getElementById("post-search"),
  newPostButton: document.getElementById("new-post-button"),
  newCategoryButton: document.getElementById("new-category-button"),
  openPostEditorButton: document.getElementById("open-post-editor-button"),
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
  postEditorHeading: document.getElementById("post-editor-heading"),
  postEditorCaption: document.getElementById("post-editor-caption"),
  postPreview: document.getElementById("post-preview"),
  postPreviewModal: document.getElementById("post-preview-modal"),
  openPublicPostLinkSummary: document.getElementById("open-public-post-link-summary"),
  openPublicPostLinkModal: document.getElementById("open-public-post-link"),
  postEditorModal: document.getElementById("post-editor-modal"),
  postEditorBackdrop: document.getElementById("post-editor-backdrop"),
  closePostEditorButton: document.getElementById("close-post-editor-button"),
  composerTitle: document.getElementById("composer-title"),
  composerSubtitle: document.getElementById("composer-subtitle"),
  insertImageButton: document.getElementById("insert-image-button"),
  imageUploadInput: document.getElementById("image-upload-input"),
  postId: document.getElementById("post-id"),
  postTitle: document.getElementById("post-title"),
  postCategory: document.getElementById("post-category"),
  postDate: document.getElementById("post-date"),
  postTags: document.getElementById("post-tags"),
  postPublishState: document.getElementById("post-publish-state"),
  postFeatured: document.getElementById("post-featured"),
  postSummary: document.getElementById("post-summary"),
  postBodyEditor: document.getElementById("post-body-editor"),
  toolbar: document.querySelector(".toolbar"),
  fontFamilySelect: document.getElementById("font-family-select"),
  fontSizeSelect: document.getElementById("font-size-select"),
  textColorInput: document.getElementById("text-color-input"),
  highlightColorInput: document.getElementById("highlight-color-input"),
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
  document.execCommand("styleWithCSS", false, true);
  populateSiteFields();
  populateCategoryFields();
  populateCategorySelect();

  const firstPost = [...editorState.content.posts].sort(byNewestDate)[0];
  if (firstPost) {
    selectPost(firstPost.id);
  } else {
    renderWorkspaceState();
  }

  renderPostList();
  setStatus("Loaded local content");
}

function populateSiteFields() {
  const { site } = editorState.content;
  fields.siteTitle.value = site.title || "";
  fields.siteTagline.value = site.tagline || "";
  fields.siteIntro.value = site.intro || "";
  fields.siteAbout.value = site.about || "";
  fields.brandMark.value = site.brandMark || "";
  fields.heroEyebrow.value = site.heroEyebrow || "";
  fields.aboutEyebrow.value = site.aboutEyebrow || "";
  fields.contactLabel.value = site.contactLabel || "";
  fields.contactHref.value = site.contactHref || "";
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
          <div class="category-card-head">
            <p class="workspace-kicker">Panel ${index + 1}</p>
            <button type="button" class="danger category-delete-button" data-category-index="${index}">Delete</button>
          </div>
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
    .map((category) => `<option value="${escapeAttribute(category.id)}">${escapeHtml(category.name)}</option>`)
    .join("");
}

function renderPostList() {
  const query = editorState.search.trim().toLowerCase();
  const posts = [...editorState.content.posts]
    .filter((post) => {
      if (!query) {
        return true;
      }
      return [post.title, post.summary, ...(post.tags || [])].join(" ").toLowerCase().includes(query);
    })
    .sort(byNewestDate);

  fields.postList.innerHTML = posts
    .map((post) => {
      const classes = ["post-item"];
      if (post.id === editorState.selectedPostId) {
        classes.push("active");
      }
      if (!(post.title || "").trim()) {
        classes.push("is-draft");
      }
      classes.push(isPublished(post) ? "is-published" : "is-unpublished");

      const formatLabel = post.bodyFormat === "html" ? "Rich" : "Markdown";
      const publishLabel = isPublished(post) ? "Published" : "Unpublished";
      return `
        <button type="button" class="${classes.join(" ")}" data-post-id="${escapeAttribute(post.id)}">
          <strong>${escapeHtml(post.title || "Untitled")}</strong>
          <span>${escapeHtml(getCategoryName(post.category))} • ${escapeHtml(post.date || "No date")} • ${publishLabel} • ${formatLabel}</span>
        </button>
      `;
    })
    .join("");
}

function selectPost(postId, options = {}) {
  const post = editorState.content.posts.find((entry) => entry.id === postId);
  editorState.selectedPostId = post?.id ?? null;
  hydratePostUI(post ?? null);
  renderPostList();
  renderWorkspaceState();

  if (post && options.openComposer) {
    openComposer();
  }
}

function hydratePostUI(post) {
  if (!post) {
    fields.postId.value = "";
    fields.postTitle.value = "";
    fields.postCategory.value = editorState.content.categories[0]?.id || "";
    fields.postDate.value = "";
    fields.postTags.value = "";
    fields.postPublishState.value = "published";
    fields.postFeatured.checked = false;
    fields.postSummary.value = "";
    fields.postBodyEditor.innerHTML = "";
    renderPostPreview(null);
    updatePublicLinks(null);
    return;
  }

  fields.postId.value = post.id || "";
  fields.postTitle.value = post.title || "";
  fields.postCategory.value = post.category || editorState.content.categories[0]?.id || "";
  fields.postDate.value = post.date || "";
  fields.postTags.value = (post.tags || []).join(", ");
  fields.postPublishState.value = isPublished(post) ? "published" : "unpublished";
  fields.postFeatured.checked = Boolean(post.featured);
  fields.postSummary.value = post.summary || "";
  fields.postBodyEditor.innerHTML = getEditableBodyHtml(post);
  renderPostPreview(post);
  updatePublicLinks(post);
}

function renderWorkspaceState() {
  const post = getCurrentPost();
  if (!post) {
    fields.postEditorHeading.textContent = "Select a post from the sidebar or create a new one.";
    fields.postEditorCaption.textContent =
      "The composer opens in a focused overlay with formatting controls, image paste support, and a live preview.";
    fields.openPostEditorButton.disabled = true;
    fields.deletePostButton.disabled = true;
    fields.postPreview.classList.add("hidden");
    return;
  }

  fields.postEditorHeading.textContent = post.title || "Untitled";
  fields.postEditorCaption.textContent =
    `${isPublished(post) ? "Published" : "Unpublished"} post. ${
      post.bodyFormat === "html"
        ? "This post already uses the rich composer format."
        : "This post is currently Markdown-backed and will convert to rich HTML the next time you save it from the composer."
    }`;
  fields.openPostEditorButton.disabled = false;
  fields.deletePostButton.disabled = false;
  fields.postPreview.classList.remove("hidden");
}

function openComposer() {
  const post = getCurrentPost();
  if (!post) {
    return;
  }

  editorState.composerOpen = true;
  fields.postEditorModal.classList.remove("hidden");
  fields.postEditorModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  fields.composerTitle.textContent = post.title || "Untitled";
  fields.composerSubtitle.textContent =
    "Write, format, paste images, then save everything back into the site JSON.";
  window.setTimeout(() => {
    fields.postTitle.focus();
  }, 0);
}

function closeComposer() {
  editorState.composerOpen = false;
  fields.postEditorModal.classList.add("hidden");
  fields.postEditorModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
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

function createCategory() {
  syncCategoryFields();
  const baseId = "new-panel";
  let suffix = 1;
  let nextId = baseId;
  while (editorState.content.categories.some((category) => category.id === nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  editorState.content.categories.push({
    id: nextId,
    name: "New panel",
    description: "Describe what belongs in this section.",
  });

  populateCategoryFields();
  populateCategorySelect();
  if (!getCurrentPost()) {
    renderWorkspaceState();
  }
  setStatus("Added a new panel");
}

function deleteCategory(categoryIndex) {
  if (editorState.content.categories.length <= 1) {
    setStatus("You need at least one panel.");
    return;
  }

  const removedCategory = editorState.content.categories[categoryIndex];
  if (!removedCategory) {
    return;
  }

  editorState.content.categories.splice(categoryIndex, 1);
  const fallbackCategoryId = editorState.content.categories[0]?.id || "personal";

  editorState.content.posts.forEach((post) => {
    if (post.category === removedCategory.id) {
      post.category = fallbackCategoryId;
    }
  });

  populateCategoryFields();
  populateCategorySelect();
  syncCurrentPost();
  renderPostList();
  renderWorkspaceState();
  setStatus(`Deleted panel "${removedCategory.name || removedCategory.id}"`);
}

function syncCurrentPost() {
  const post = getCurrentPost();
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
  post.published = fields.postPublishState.value === "published";
  post.featured = fields.postFeatured.checked;
  post.summary = fields.postSummary.value.trim();
  post.body = normalizeComposerHtml(fields.postBodyEditor.innerHTML);
  post.bodyFormat = "html";

  editorState.selectedPostId = post.id;
  fields.postId.value = post.id;
  fields.composerTitle.textContent = post.title || "Untitled";
  renderPostPreview(post);
  updatePublicLinks(post);
  renderPostList();
  renderWorkspaceState();
}

function syncAllFields() {
  syncSiteFields();
  syncCategoryFields();
  populateCategorySelect();
  syncCurrentPost();
}

function createPost() {
  syncAllFields();
  const baseId = "new-post";
  let suffix = 1;
  let nextId = baseId;
  while (editorState.content.posts.some((post) => post.id === nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  editorState.content.posts.unshift({
    id: nextId,
    title: "",
    category: editorState.content.categories[0]?.id || "personal",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    published: false,
    featured: false,
    tags: [],
    bodyFormat: "html",
    body: "<h2>Start here</h2><p>Write the first draft of this post.</p>",
  });

  populateCategorySelect();
  selectPost(nextId, { openComposer: true });
  setStatus("Created a new post draft");
}

function deleteCurrentPost() {
  const post = getCurrentPost();
  if (!post) {
    return;
  }

  const remainingPosts = editorState.content.posts.filter((entry) => entry.id !== post.id);
  editorState.content.posts = remainingPosts;
  const nextPost = [...remainingPosts].sort(byNewestDate)[0] || null;
  if (nextPost) {
    selectPost(nextPost.id);
  } else {
    editorState.selectedPostId = null;
    hydratePostUI(null);
    renderPostList();
    renderWorkspaceState();
  }
  closeComposer();
  setStatus("Deleted the selected post");
}

async function saveAllChanges() {
  syncAllFields();
  validateBeforeSave();
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

function validateBeforeSave() {
  const postIds = editorState.content.posts.map((post) => post.id);
  const duplicates = postIds.filter((postId, index) => postIds.indexOf(postId) !== index);
  if (duplicates.length) {
    throw new Error(`Duplicate post slug: ${duplicates[0]}`);
  }

  if (editorState.content.posts.some((post) => !post.title.trim())) {
    throw new Error("Every post needs a title before saving.");
  }
}

function renderPostPreview(post) {
  const targets = [fields.postPreview, fields.postPreviewModal];

  if (!post) {
    targets.forEach((target) => {
      target.innerHTML = `<p class="empty-state">Select or create a post to preview it here.</p>`;
    });
    return;
  }

  const bodyHtml = renderPostBody(post);
  const markup = `
    <p class="eyebrow">${escapeHtml(getCategoryName(post.category))}</p>
    <h3 class="preview-title">${escapeHtml(post.title || "Untitled")}</h3>
    <div class="preview-meta">
      <span class="preview-chip">${escapeHtml(formatDate(post.date || new Date().toISOString().slice(0, 10)))}</span>
      <span class="preview-chip">${isPublished(post) ? "Published" : "Unpublished"}</span>
      ${post.featured ? `<span class="preview-chip">Featured</span>` : ""}
      <span class="preview-chip">${post.bodyFormat === "html" ? "Rich HTML" : "Markdown"}</span>
    </div>
    <p class="preview-summary">${escapeHtml(post.summary || "Add a summary to preview the lead text here.")}</p>
    <div class="preview-tags">
      ${
        (post.tags || []).length
          ? post.tags.map((tag) => `<span class="preview-tag">${escapeHtml(tag)}</span>`).join("")
          : `<span class="preview-tag">No tags yet</span>`
      }
    </div>
    <div class="preview-body">${bodyHtml}</div>
  `;

  targets.forEach((target) => {
    target.innerHTML = markup;
  });
}

function renderEditorSidebarCopy() {
  const { site } = editorState.content;
  fields.editorEyebrowDisplay.textContent = site.editorEyebrow || "Local editor";
  fields.editorTitleDisplay.textContent = site.editorTitle || site.title || "Blue Shell Almanac";
  fields.editorDescriptionDisplay.textContent =
    site.editorDescription || "Manage site copy and posts here. Saving writes directly to data/content.json.";
}

function updatePublicLinks(post) {
  const href = post ? `/?post=${encodeURIComponent(post.id)}` : "/";
  fields.openPublicPostLinkSummary.href = href;
  fields.openPublicPostLinkModal.href = href;
}

function getCurrentPost() {
  return editorState.content.posts.find((entry) => entry.id === editorState.selectedPostId) || null;
}

function isPublished(post) {
  return post.published !== false;
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

function getEditableBodyHtml(post) {
  if (post.bodyFormat === "html") {
    return sanitizeRichHtml(post.body || "");
  }
  return renderMarkdown(post.body || "");
}

function renderPostBody(post) {
  if (post.bodyFormat === "html") {
    return sanitizeRichHtml(post.body || "");
  }
  return renderMarkdown(post.body || "");
}

function normalizeComposerHtml(html) {
  const cleaned = sanitizeRichHtml(html || "").trim();
  return cleaned || "<p></p>";
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

function saveComposerSelection() {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    return;
  }

  const range = selection.getRangeAt(0);
  if (fields.postBodyEditor.contains(range.commonAncestorContainer)) {
    editorState.savedSelection = range.cloneRange();
  }
}

function restoreComposerSelection() {
  if (!editorState.savedSelection) {
    return;
  }

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(editorState.savedSelection);
}

function applyFormatting(command, value) {
  fields.postBodyEditor.focus();
  restoreComposerSelection();
  document.execCommand(command, false, value);
  saveComposerSelection();
  syncCurrentPost();
}

async function handleImageFile(file) {
  if (!file) {
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const safeAlt = file.name ? escapeAttribute(file.name.replace(/\.[^.]+$/, "")) : "Pasted image";
  applyFormatting("insertHTML", `<figure><img src="${dataUrl}" alt="${safeAlt}" /></figure><p></p>`);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugify(value) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "untitled-post"
  );
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

fields.categoryFields.addEventListener("input", () => {
  syncCategoryFields();
  populateCategorySelect();
  syncCurrentPost();
  renderPostList();
  renderWorkspaceState();
});

[
  fields.postId,
  fields.postTitle,
  fields.postDate,
  fields.postTags,
  fields.postSummary,
].forEach((field) => {
  field.addEventListener("input", () => {
    syncCurrentPost();
  });
});

fields.postCategory.addEventListener("change", () => {
  syncCurrentPost();
});

fields.postPublishState.addEventListener("change", () => {
  syncCurrentPost();
});

fields.postFeatured.addEventListener("change", () => {
  syncCurrentPost();
});

fields.postBodyEditor.addEventListener("input", () => {
  syncCurrentPost();
});

["keyup", "mouseup", "blur"].forEach((eventName) => {
  fields.postBodyEditor.addEventListener(eventName, () => {
    saveComposerSelection();
  });
});

fields.postBodyEditor.addEventListener("paste", async (event) => {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) {
    return;
  }

  event.preventDefault();
  const file = imageItem.getAsFile();
  await handleImageFile(file);
});

fields.toolbar.addEventListener("mousedown", (event) => {
  if (event.target.closest("button")) {
    event.preventDefault();
  }
});

fields.toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-command]");
  if (!button) {
    return;
  }

  const command = button.dataset.command;
  const value = button.dataset.value;
  applyFormatting(command, value);
});

fields.fontFamilySelect.addEventListener("change", (event) => {
  const value = event.target.value === "inherit" ? "Manrope" : event.target.value;
  applyFormatting("fontName", value);
});

fields.fontSizeSelect.addEventListener("change", (event) => {
  applyFormatting("fontSize", event.target.value);
});

fields.textColorInput.addEventListener("input", (event) => {
  applyFormatting("foreColor", event.target.value);
});

fields.highlightColorInput.addEventListener("input", (event) => {
  applyFormatting("hiliteColor", event.target.value);
});

fields.insertImageButton.addEventListener("click", () => {
  fields.imageUploadInput.click();
});

fields.imageUploadInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  await handleImageFile(file);
  event.target.value = "";
});

fields.postList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-post-id]");
  if (!button) {
    return;
  }

  syncAllFields();
  selectPost(button.dataset.postId, { openComposer: true });
});

fields.newPostButton.addEventListener("click", () => {
  createPost();
});

fields.newCategoryButton.addEventListener("click", () => {
  createCategory();
});

fields.openPostEditorButton.addEventListener("click", () => {
  syncAllFields();
  openComposer();
});

fields.deletePostButton.addEventListener("click", () => {
  deleteCurrentPost();
});

fields.categoryFields.addEventListener("click", (event) => {
  const button = event.target.closest(".category-delete-button");
  if (!button) {
    return;
  }

  deleteCategory(Number(button.dataset.categoryIndex));
});

fields.closePostEditorButton.addEventListener("click", () => {
  syncAllFields();
  closeComposer();
});

fields.postEditorBackdrop.addEventListener("click", () => {
  syncAllFields();
  closeComposer();
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editorState.composerOpen) {
    syncAllFields();
    closeComposer();
  }
});

function setStatus(message) {
  fields.status.textContent = message;
}

initEditor().catch((error) => {
  fields.status.textContent = error.message;
});
