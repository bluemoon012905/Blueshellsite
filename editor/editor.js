const editorState = {
  content: null,
  selectedPostId: null,
  search: "",
};

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
  contactLabel: document.getElementById("contact-label"),
  contactHref: document.getElementById("contact-href"),
  categoryFields: document.getElementById("category-fields"),
  postEditor: document.getElementById("post-editor"),
  postEditorHeading: document.getElementById("post-editor-heading"),
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
  fields.contactLabel.value = site.contactLabel;
  fields.contactHref.value = site.contactHref;
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

  renderPostList();
}

function syncSiteFields() {
  const { site } = editorState.content;
  site.title = fields.siteTitle.value.trim();
  site.tagline = fields.siteTagline.value.trim();
  site.intro = fields.siteIntro.value.trim();
  site.about = fields.siteAbout.value.trim();
  site.contactLabel = fields.contactLabel.value.trim();
  site.contactHref = fields.contactHref.value.trim();
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

function getCategoryName(categoryId) {
  return editorState.content.categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

function byNewestDate(left, right) {
  return new Date(right.date) - new Date(left.date);
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

fields.postSearch.addEventListener("input", (event) => {
  editorState.search = event.target.value;
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
