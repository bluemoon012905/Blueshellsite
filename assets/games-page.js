const { escapeHtml, escapeAttribute } = window.BlueshellContent;

const SLOT_SYMBOL_SOURCES = [
  "../assets/images/ASU_logo.png",
  "../assets/images/turtle-scenes/turtle_hole.png",
  "../assets/images/turtle-scenes/turtle_trap.png",
  "../assets/images/turtle-variants/turtle_100.png",
  "../assets/images/turtle-variants/turtle_book.png",
  "../assets/images/turtle-variants/turtle_cheese.png",
  "../assets/images/turtle-variants/turtle_chicken.png",
  "../assets/images/turtle-variants/turtle_cowboy.png",
  "../assets/images/turtle-variants/turtle_explode.png",
  "../assets/images/turtle-variants/turtle_fishing.png",
  "../assets/images/turtle-variants/turtle_fortune.png",
  "../assets/images/turtle-variants/turtle_frog.png",
  "../assets/images/turtle-variants/turtle_glasses.png",
  "../assets/images/turtle-variants/turtle_headphone.png",
  "../assets/images/turtle-variants/turtle_infinity.png",
  "../assets/images/turtle-variants/turtle_melon.png",
  "../assets/images/turtle-variants/turtle_moon.png",
  "../assets/images/turtle-variants/turtle_poop.png",
  "../assets/images/turtle-variants/turtle_scholar.png",
  "../assets/images/turtle-variants/turtle_scropion.png",
  "../assets/images/turtle-variants/turtle_sprial.png",
  "../assets/images/turtle-variants/turtle_volleyball.png",
  "../assets/images/turtle.png",
  "../assets/images/turtle_DNA.png",
  "../assets/images/turtle_graph_up.png",
  "../assets/images/turtle_news_paper.png",
  "../assets/images/turtle_roller_coaster.png",
  "../assets/images/turtle_scholar.png",
  "../assets/images/turtle_slot.png",
];

const SLOT_SYMBOLS = SLOT_SYMBOL_SOURCES.map((src) => ({
  name: deriveSymbolName(src),
  src,
}));

const SLOT_REEL_COUNT = 3;
const SLOT_SYMBOL_HEIGHT = 112;
const SLOT_LOOP_MULTIPLIER = 4;
const SLOT_RAIN_COUNT = 12;
const SLOT_JACKPOT_MULTIPLIER = 10;

let slotMachine = null;

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
    <div class="games-hero-decoration">
      <div class="games-slot-machine" data-slot-machine>
        <div class="games-slot-window" role="img" aria-label="Three slot reels showing turtle and ASU images">
          ${Array.from({ length: SLOT_REEL_COUNT }, (_, index) => renderSlotReel(index)).join("")}
        </div>
        <button class="games-slot-handle" type="button" data-slot-trigger aria-label="Spin the turtle slot machine">
          <span class="games-slot-handle-bar" aria-hidden="true"></span>
          <span class="games-slot-handle-ball">Click me</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("games-grid").innerHTML = games.length
    ? games.map(renderGameCard).join("")
    : '<p class="empty-state">No game links are listed yet.</p>';
  initSlotMachine();
  window.BlueshellContent.initLocalDebugPanels();
}

function renderSlotReel(index) {
  const offset = (index * 7) % SLOT_SYMBOLS.length;
  const reelSymbols = buildReelSymbols(offset);
  return `
    <div class="games-slot-reel">
      <div class="games-slot-track" data-slot-track="${index}">
        ${reelSymbols
          .map(
            (symbol) => `
              <div class="games-slot-symbol">
                <img src="${escapeAttribute(symbol.src)}" alt="${escapeAttribute(symbol.name)}" />
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildReelSymbols(offset) {
  const ordered = SLOT_SYMBOLS.map((_, index) => SLOT_SYMBOLS[(index + offset) % SLOT_SYMBOLS.length]);
  const repeated = [];
  for (let loop = 0; loop < SLOT_LOOP_MULTIPLIER; loop += 1) {
    repeated.push(...ordered);
  }
  return repeated;
}

function initSlotMachine() {
  const machineNode = document.querySelector("[data-slot-machine]");
  const triggerNode = document.querySelector("[data-slot-trigger]");
  const trackNodes = Array.from(document.querySelectorAll("[data-slot-track]"));
  const rainNode = ensureRainNode();

  if (!machineNode || !triggerNode || !rainNode || !trackNodes.length) {
    return;
  }

  slotMachine = {
    isSpinning: false,
    machineNode,
    triggerNode,
    rainNode,
    reels: trackNodes.map((trackNode, index) => ({
      trackNode,
      reelNode: trackNode.closest(".games-slot-reel"),
      reelIndex: index,
      offset: (index * 7) % SLOT_SYMBOLS.length,
      currentSymbolIndex: (index * 7) % SLOT_SYMBOLS.length,
      frameId: 0,
    })),
  };

  syncReels(slotMachine.reels);
  triggerNode.addEventListener("click", spinSlotMachine);
}

function spinSlotMachine() {
  if (!slotMachine || slotMachine.isSpinning) {
    return;
  }

  slotMachine.isSpinning = true;
  slotMachine.machineNode.classList.add("is-spinning");
  slotMachine.triggerNode.disabled = true;
  slotMachine.rainNode.innerHTML = "";
  clearMatchedReels(slotMachine.reels);

  const shouldJackpot = Math.random() < 0.2;
  const jackpotIndex = randomIndex(SLOT_SYMBOLS.length);
  const outcomes = slotMachine.reels.map(() => (shouldJackpot ? jackpotIndex : randomIndex(SLOT_SYMBOLS.length)));
  const reelPlans = slotMachine.reels.map((reel, index) => {
    const duration = 1900 + Math.random() * 700 + index * 420;
    const deceleration = 1.9 + Math.random() * 1.4;
    const loops = 2 + index + Math.floor(Math.random() * 3);
    return {
      reel,
      targetIndex: outcomes[index],
      duration,
      deceleration,
      loops,
    };
  });

  Promise.all(
    reelPlans.map((plan) => animateReel(plan.reel, plan.targetIndex, plan.duration, plan.deceleration, plan.loops)),
  ).then(() => {
    slotMachine.isSpinning = false;
    slotMachine.machineNode.classList.remove("is-spinning");
    slotMachine.triggerNode.disabled = false;
    const winningResult = getWinningResult(outcomes);
    if (winningResult) {
      highlightMatchedReels(slotMachine.reels, winningResult.symbolIndex);
      rainRolledEmote(winningResult.symbol, winningResult.count);
    }
  });
}

function animateReel(reel, targetSymbolIndex, duration, deceleration, loops) {
  cancelAnimationFrame(reel.frameId);

  const startTrackIndex = getTrackIndexForSymbol(reel, reel.currentSymbolIndex);
  const targetTrackIndex = getTrackIndexForSymbol(reel, targetSymbolIndex);
  const startOffset = startTrackIndex * SLOT_SYMBOL_HEIGHT;
  const cycleHeight = SLOT_SYMBOLS.length * SLOT_SYMBOL_HEIGHT;
  const targetTravel =
    loops * cycleHeight + normalizeIndexDistance(startTrackIndex, targetTrackIndex) * SLOT_SYMBOL_HEIGHT;

  return new Promise((resolve) => {
    const startTime = performance.now();

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, deceleration);
      const offset = (startOffset + targetTravel * easedProgress) % cycleHeight;
      reel.trackNode.style.transform = `translateY(${-offset}px)`;

      if (progress < 1) {
        reel.frameId = requestAnimationFrame(step);
        return;
      }

      reel.currentSymbolIndex = targetSymbolIndex;
      reel.trackNode.style.transform = `translateY(${-targetTrackIndex * SLOT_SYMBOL_HEIGHT}px)`;
      resolve();
    };

    reel.frameId = requestAnimationFrame(step);
  });
}

function syncReels(reels) {
  reels.forEach((reel) => {
    const trackIndex = getTrackIndexForSymbol(reel, reel.currentSymbolIndex);
    reel.trackNode.style.transform = `translateY(${-trackIndex * SLOT_SYMBOL_HEIGHT}px)`;
  });
}

function rainRolledEmote(symbol, matchCount) {
  if (!slotMachine) {
    return;
  }

  const isJackpot = matchCount >= 3;
  const rainCount = isJackpot ? SLOT_RAIN_COUNT * SLOT_JACKPOT_MULTIPLIER : SLOT_RAIN_COUNT;
  slotMachine.rainNode.innerHTML = Array.from({ length: rainCount }, (_, index) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 1.4;
    const duration = 2.6 + Math.random() * 1.8;
    const drift = -140 + Math.random() * 280;
    const size = (38 + Math.random() * 48) * 2;
    const bounceOne = -170 - Math.random() * 220;
    const bounceTwo = -110 - Math.random() * 160;
    const bounceThree = -70 - Math.random() * 110;
    const bounceFour = -36 - Math.random() * 70;
    const driftTwo = drift + (-220 + Math.random() * 440);
    const driftThree = driftTwo + (-240 + Math.random() * 480);
    const driftFour = driftThree + (-180 + Math.random() * 360);
    const rotateOne = 320 + Math.random() * 280;
    const rotateTwo = rotateOne + 180 + Math.random() * 240;
    const rotateThree = rotateTwo + 140 + Math.random() * 220;
    const rotateFour = rotateThree + 120 + Math.random() * 180;
    const rotateFive = rotateFour + 90 + Math.random() * 150;

    return `
      <img
        class="games-slot-rain-piece"
        src="${escapeAttribute(symbol.src)}"
        alt=""
        style="left:${left}%;--rain-delay:${delay}s;--rain-duration:${duration}s;--rain-drift:${drift}px;--rain-drift-two:${driftTwo}px;--rain-drift-three:${driftThree}px;--rain-drift-four:${driftFour}px;--rain-size:${size}px;--rain-bounce-one:${bounceOne}px;--rain-bounce-two:${bounceTwo}px;--rain-bounce-three:${bounceThree}px;--rain-bounce-four:${bounceFour}px;--rain-rotate-one:${rotateOne}deg;--rain-rotate-two:${rotateTwo}deg;--rain-rotate-three:${rotateThree}deg;--rain-rotate-four:${rotateFour}deg;--rain-rotate-five:${rotateFive}deg;"
        data-rain-piece="${index}"
      />
    `;
  }).join("");

  window.setTimeout(() => {
    if (slotMachine) {
      slotMachine.rainNode.innerHTML = "";
    }
  }, 6200);
}

function normalizeIndexDistance(startIndex, targetIndex) {
  if (targetIndex >= startIndex) {
    return targetIndex - startIndex;
  }
  return SLOT_SYMBOLS.length - startIndex + targetIndex;
}

function getTrackIndexForSymbol(reel, symbolIndex) {
  return modulo(symbolIndex - reel.offset, SLOT_SYMBOLS.length);
}

function modulo(value, length) {
  return ((value % length) + length) % length;
}

function getWinningResult(outcomes) {
  const counts = new Map();

  outcomes.forEach((symbolIndex) => {
    counts.set(symbolIndex, (counts.get(symbolIndex) || 0) + 1);
  });

  let bestSymbolIndex = -1;
  let bestCount = 0;

  counts.forEach((count, symbolIndex) => {
    if (count > bestCount) {
      bestCount = count;
      bestSymbolIndex = symbolIndex;
    }
  });

  if (bestCount < 2) {
    return null;
  }

  return {
    symbol: SLOT_SYMBOLS[bestSymbolIndex],
    symbolIndex: bestSymbolIndex,
    count: bestCount,
  };
}

function highlightMatchedReels(reels, symbolIndex) {
  reels.forEach((reel) => {
    if (!reel.reelNode) {
      return;
    }
    reel.reelNode.classList.toggle("is-match", reel.currentSymbolIndex === symbolIndex);
  });
}

function clearMatchedReels(reels) {
  reels.forEach((reel) => {
    reel.reelNode?.classList.remove("is-match");
  });
}

function ensureRainNode() {
  let rainNode = document.querySelector("[data-slot-rain]");
  if (!rainNode) {
    rainNode = document.createElement("div");
    rainNode.className = "games-slot-rain";
    rainNode.setAttribute("data-slot-rain", "");
    rainNode.setAttribute("aria-hidden", "true");
    document.body.appendChild(rainNode);
  }
  return rainNode;
}

function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

function deriveSymbolName(src) {
  return src
    .split("/")
    .pop()
    .replace(/\.[a-z]+$/i, "")
    .replaceAll(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
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
