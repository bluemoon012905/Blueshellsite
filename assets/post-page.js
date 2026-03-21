const { escapeHtml, formatDate, renderPostBody } = window.BlueshellContent;
const speechState = {
  supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
  active: false,
  utterance: null,
};

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
    <div class="post-audio-controls">
      <button class="ghost-link post-audio-button" type="button" ${speechState.supported ? "" : "disabled"}>
        ${speechState.supported ? "Read aloud" : "Read aloud unavailable"}
      </button>
    </div>
    <div class="post-body">${renderPostBody(post)}</div>
  `;

  bindReadAloud(post);
}

function bindReadAloud(post) {
  const button = document.querySelector(".post-audio-button");
  const postBody = document.querySelector(".post-body");
  if (!button || !postBody || !speechState.supported) {
    return;
  }

  const speechText = buildSpeechText(post, postBody);
  if (!speechText.trim()) {
    button.disabled = true;
    button.textContent = "Nothing to read";
    return;
  }

  window.speechSynthesis.cancel();
  speechState.active = false;
  speechState.utterance = null;
  updateReadAloudButton(button);

  button.addEventListener("click", () => {
    if (speechState.active) {
      stopReading(button);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      speechState.active = false;
      speechState.utterance = null;
      updateReadAloudButton(button);
    };
    utterance.onerror = () => {
      speechState.active = false;
      speechState.utterance = null;
      updateReadAloudButton(button);
    };

    window.speechSynthesis.cancel();
    speechState.utterance = utterance;
    speechState.active = true;
    updateReadAloudButton(button);
    window.speechSynthesis.speak(utterance);
  });

  window.addEventListener(
    "beforeunload",
    () => {
      window.speechSynthesis.cancel();
    },
    { once: true }
  );
}

function buildSpeechText(post, postBody) {
  const bodyText = postBody.textContent.replace(/\s+/g, " ").trim();
  return [post.title, post.summary, bodyText].filter(Boolean).join(". ");
}

function stopReading(button) {
  window.speechSynthesis.cancel();
  speechState.active = false;
  speechState.utterance = null;
  updateReadAloudButton(button);
}

function updateReadAloudButton(button) {
  button.textContent = speechState.active ? "Stop reading" : "Read aloud";
}
