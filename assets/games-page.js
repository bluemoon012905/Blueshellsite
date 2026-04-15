const { escapeHtml, escapeAttribute } = window.BlueshellContent;

const GAME_ANNOTATIONS = {
  "https://bluemoon012905.github.io/Turtle-math-benchmark/": {
    title: "Math Game",
    summary: "A math-focused turtle game with a benchmark framing, built as a quick browser-playable project.",
    kind: "Browser game",
    category: "Games",
    image: "../assets/images/turtle_graph_up.png",
  },
  "https://bluemoon012905.github.io/Reverse_wordle/": {
    title: "Reverse Wordle",
    summary: "A word puzzle riff that flips the usual Wordle direction and turns the guessing logic around.",
    kind: "Browser game",
    category: "Games",
    image: "../assets/images/turtle_news_paper.png",
  },
};

loadGamesPage().catch((error) => {
  document.title = "Games | Blue";
  document.getElementById("games-hero").innerHTML = `
    <div class="hero-copy">
      <p class="eyebrow">Games</p>
      <h1>Games page unavailable</h1>
      <p>${escapeHtml(error.message)}</p>
      <div class="hero-actions">
        <a class="ghost-link" href="/">Back home</a>
      </div>
    </div>
  `;
  document.getElementById("games-grid").innerHTML =
    '<p class="empty-state">Could not load the games page right now.</p>';
});

async function loadGamesPage() {
  const [contentResponse, gameListResponse] = await Promise.all([
    fetch("../data/content.json", { cache: "no-store" }),
    fetch("./gamelist.md", { cache: "no-store" }),
  ]);
  if (!contentResponse.ok) {
    throw new Error("Could not load site content.");
  }
  if (!gameListResponse.ok) {
    throw new Error("Could not load game links.");
  }

  const content = await contentResponse.json();
  const gameListMarkdown = await gameListResponse.text();
  const siteTitle = content.site?.title || "Blue's collection";
  const brandMark = content.site?.brandMark || siteTitle;
  const games = parseGameLinks(gameListMarkdown);

  document.title = `Games | ${siteTitle}`;
  document.getElementById("games-hero").innerHTML = `
    <div class="hero-nav">
      <div class="brand-mark">
        <span>${escapeHtml(brandMark)}</span>
      </div>
      <a class="ghost-link" href="/">Back home</a>
    </div>
    <div class="hero-copy">
      <p class="eyebrow">Games</p>
      <h1>Playable projects</h1>
      <p>A separate shelf for things that are meant to be clicked open and played, without digging through the whole archive first.</p>
    </div>
    <div class="games-hero-decoration" aria-hidden="true">
      <img
        class="games-hero-decoration-image"
        src="../assets/images/turtle_slot.png"
        alt=""
      />
    </div>
  `;

  document.getElementById("games-grid").innerHTML = games.length
    ? games.map(renderGameCard).join("")
    : '<p class="empty-state">No game links are listed yet.</p>';
  window.BlueshellContent.initLocalDebugPanels();
}

function parseGameLinks(markdown) {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((href) => {
      const annotation = GAME_ANNOTATIONS[href] || {};
      return {
        href,
        title: annotation.title || deriveTitleFromHref(href),
        summary: annotation.summary || "External playable project link.",
        kind: annotation.kind || "Browser game",
        category: annotation.category || "Games",
        image: annotation.image || "",
      };
    });
}

function deriveTitleFromHref(href) {
  try {
    const url = new URL(href);
    const slug = url.pathname.split("/").filter(Boolean).pop() || "game";
    return slug
      .replaceAll(/[-_]+/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  } catch {
    return "Untitled game";
  }
}

function renderGameCard(game) {
  return `
    <article class="post-card game-card">
      ${
        game.image
          ? `<img class="game-card-image" src="${escapeAttribute(game.image)}" alt="${escapeAttribute(game.title)}" />`
          : ""
      }
      <span class="post-chip">${escapeHtml(game.category)}</span>
      <h3>${escapeHtml(game.title)}</h3>
      <p>${escapeHtml(game.summary)}</p>
      <div class="games-card-meta">
        <span class="tag">${escapeHtml(game.kind)}</span>
      </div>
      <div class="hero-actions">
        <a class="pill-link" href="${escapeAttribute(game.href)}" target="_blank" rel="noreferrer">Open game</a>
      </div>
    </article>
  `;
}
