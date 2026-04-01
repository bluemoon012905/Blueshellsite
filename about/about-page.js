const aboutElements = {
  hero: document.getElementById("about-hero"),
  sections: document.getElementById("about-sections"),
};
const asuMotionState = {
  resizeHandlerBound: false,
  resizeTimer: null,
  rafId: null,
};

loadAboutPage().catch(() => {
  document.title = "About me | Blue";
  aboutElements.hero.innerHTML = window.BlueshellAboutSections.renderAboutPage({
    contactLabel: "About me",
    about: "Could not load site content.",
    contactHref: "",
  }).hero;
  aboutElements.sections.innerHTML = `
    <section class="section">
      <div class="section-heading">
        <div>
          <h2>Reach out</h2>
        </div>
      </div>
      <p class="empty-state">Email unavailable.</p>
    </section>
  `;
  window.BlueshellContent.initLocalDebugPanels();
});

async function loadAboutPage() {
  const response = await fetch("../data/content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load page content.");
  }

  const content = await response.json();
  const site = content.site || {};
  const page = window.BlueshellAboutSections.renderAboutPage(site);

  document.title = `${site.contactLabel || "About me"} | Blue`;
  aboutElements.hero.innerHTML = page.hero;
  aboutElements.sections.innerHTML = page.sections;
  bindCopyEmail(page.email);
  initializeAsuMotion();
  window.BlueshellContent.initLocalDebugPanels();
}

function bindCopyEmail(email) {
  const copyButton = document.getElementById("copy-email-button");
  if (!copyButton) {
    return;
  }

  copyButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!email) {
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Failed";
    }

    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1600);
  });
}

function initializeAsuMotion() {
  scheduleAsuMotion();

  const photo = document.querySelector(".asu-photo");
  if (photo && !photo.complete) {
    photo.addEventListener("load", scheduleAsuMotion, { once: true });
  }

  if (asuMotionState.resizeHandlerBound) {
    return;
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(asuMotionState.resizeTimer);
    asuMotionState.resizeTimer = window.setTimeout(scheduleAsuMotion, 180);
  });
  asuMotionState.resizeHandlerBound = true;
}

function scheduleAsuMotion() {
  if (asuMotionState.rafId) {
    window.cancelAnimationFrame(asuMotionState.rafId);
  }

  asuMotionState.rafId = window.requestAnimationFrame(() => {
    asuMotionState.rafId = window.requestAnimationFrame(() => {
      asuMotionState.rafId = null;
      runAsuMotion();
    });
  });
}

function runAsuMotion() {
  const stage = document.querySelector(".asu-media-stage");
  if (!stage) {
    return;
  }

  animateAsuSprite(stage, document.querySelector(".asu-sprite-turtle"), {
    angleSpread: 0.7,
    exitOffset: 1.7,
    rotationDirection: -1,
    yJitter: 26,
  });

  animateAsuSprite(stage, document.querySelector(".asu-sprite-logo"), {
    angleSpread: 0.95,
    exitOffset: 1.95,
    rotationDirection: 1,
    yJitter: 34,
  });
}

function animateAsuSprite(stage, sprite, options) {
  if (!sprite) {
    return;
  }

  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;
  const spriteWidth = sprite.offsetWidth;
  const spriteHeight = sprite.offsetHeight;
  if (!stageWidth || !stageHeight || !spriteWidth || !spriteHeight) {
    return;
  }

  const restX = sprite.offsetLeft;
  const restY = sprite.offsetTop;
  const boundsWidth = Math.max(stageWidth - spriteWidth, 0);
  const boundsHeight = Math.max(stageHeight - spriteHeight, 0);
  const path = generateBouncePath({
    startX: restX,
    startY: restY,
    boundsWidth,
    boundsHeight,
    spriteWidth,
    rotationDirection: options.rotationDirection,
    angleSpread: options.angleSpread,
    exitOffset: options.exitOffset,
    yJitter: options.yJitter,
  });
  const keyframes = buildReverseKeyframes(path, restX, restY);

  sprite.getAnimations().forEach((animation) => animation.cancel());
  sprite.classList.add("is-ready");
  sprite.animate(keyframes, {
    duration: Math.round(path.totalTime * 1000),
    easing: "linear",
    fill: "forwards",
  });
}

function generateBouncePath(config) {
  const {
    startX,
    startY,
    boundsWidth,
    boundsHeight,
    spriteWidth,
    rotationDirection,
    angleSpread,
    exitOffset,
    yJitter,
  } = config;
  const points = [{ x: startX, y: startY, rotation: 0, time: 0 }];
  const bounceCount = randomInt(4, 6);
  let x = startX;
  let y = startY;
  let angle = Math.PI + randomRange(-angleSpread, angleSpread);
  if (Math.cos(angle) > -0.25) {
    angle = Math.PI + (Math.random() < 0.5 ? -1 : 1) * randomRange(0.4, angleSpread + 0.2);
  }

  let velocityX = Math.cos(angle);
  let velocityY = Math.sin(angle);
  let speed = randomRange(170, 220);
  let rotation = 0;
  const rotationRate = randomRange(0.7, 1.1) * rotationDirection;
  let time = 0;

  for (let index = 0; index < bounceCount; index += 1) {
    const hitTimeX =
      velocityX > 0 ? (boundsWidth - x) / velocityX : velocityX < 0 ? -x / velocityX : Number.POSITIVE_INFINITY;
    const hitTimeY =
      velocityY > 0 ? (boundsHeight - y) / velocityY : velocityY < 0 ? -y / velocityY : Number.POSITIVE_INFINITY;
    const travelFactor = Math.max(Math.min(hitTimeX, hitTimeY), 0);
    const distance = travelFactor;
    const duration = distance / speed;

    x += velocityX * travelFactor;
    y += velocityY * travelFactor;
    time += duration;
    rotation += distance * rotationRate;

    points.push({
      x: clamp(x, 0, boundsWidth),
      y: clamp(y, 0, boundsHeight),
      rotation,
      time,
    });

    if (Math.abs(hitTimeX - travelFactor) < 0.001) {
      velocityX *= -1;
    }
    if (Math.abs(hitTimeY - travelFactor) < 0.001) {
      velocityY *= -1;
    }

    speed *= randomRange(1.14, 1.22);
  }

  const exitX = boundsWidth + spriteWidth * exitOffset;
  const exitY = clamp(startY + randomRange(-yJitter, yJitter), 0, boundsHeight);
  const exitDistance = Math.hypot(exitX - x, exitY - y);
  time += exitDistance / speed;
  rotation += exitDistance * rotationRate;
  points.push({ x: exitX, y: exitY, rotation, time });

  return {
    points,
    totalTime: Math.max(time, 2.6),
  };
}

function buildReverseKeyframes(path, restX, restY) {
  return path.points
    .slice()
    .reverse()
    .map((point) => ({
      transform: `translate(${(point.x - restX).toFixed(2)}px, ${(point.y - restY).toFixed(2)}px) rotate(${point.rotation.toFixed(2)}deg)`,
      offset: (1 - point.time / path.totalTime).toFixed(4),
    }));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
