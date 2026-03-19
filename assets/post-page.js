const { escapeHtml, formatDate, renderPostBody } = window.BlueshellContent;

loadPost().catch((error) => {
  document.getElementById("post-hero").innerHTML = `
    <div class="hero-copy">
      <p class="eyebrow">Post</p>
      <h1>Not available</h1>
      <p>${escapeHtml(error.message)}</p>
      <div class="hero-actions">
        <a class="ghost-link" href="/">Back home</a>
      </div>
    </div>
  `;
  document.getElementById("post-shell").innerHTML = '<p class="empty-state">That post could not be loaded.</p>';
});

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("post");
  if (!postId) {
    throw new Error("No post was provided.");
  }

  const response = await fetch("../data/content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load content.");
  }

  const content = await response.json();
  const publishedPosts = (content.posts || []).filter((post) => post.published !== false);
  const post = publishedPosts.find((entry) => entry.id === postId);
  if (!post) {
    throw new Error("That post does not exist.");
  }

  const category = (content.categories || []).find((entry) => entry.id === post.category);
  const categoryName = category?.name || post.category;

  document.title = `${post.title} | ${content.site?.title || "Blue's collection"}`;
  document.getElementById("post-hero").innerHTML = `
    <div class="hero-nav">
      <div class="brand-mark">
        <span>${escapeHtml(content.site?.brandMark || content.site?.title || "Blue's collection")}</span>
      </div>
      <div class="hero-actions">
        <a class="ghost-link" href="/category/?category=${encodeURIComponent(post.category)}">Back to ${escapeHtml(categoryName)}</a>
        <a class="ghost-link" href="/">Back home</a>
      </div>
    </div>
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(categoryName)}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.summary)}</p>
    </div>
  `;

  document.getElementById("post-shell").innerHTML = `
    <div class="post-meta">
      <span class="tag">${formatDate(post.date)}</span>
      ${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
    <div class="post-body">${renderPostBody(post)}</div>
  `;
}
