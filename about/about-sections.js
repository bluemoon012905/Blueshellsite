const { escapeHtml, escapeAttribute } = window.BlueshellContent;

const ABOUT_SOCIAL_LINKS = [
  {
    label: "Instagram",
    value: "@theturlytt",
    href: "https://www.instagram.com/theturlytt/",
    icon: `
      <svg viewBox="0 0 24 24" role="img">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect>
        <circle cx="12" cy="12" r="4.25"></circle>
        <circle cx="17.4" cy="6.6" r="1.1" class="fill"></circle>
      </svg>
    `,
  },
  {
    label: "Discord",
    value: "bluemoon012905",
    href: "https://discord.com/users/bluemoon012905",
    icon: `
      <svg viewBox="0 0 24 24" role="img">
        <path
          d="M18.4 6.2a16 16 0 0 0-3.2-1l-.4.8a11 11 0 0 0-5.6 0l-.4-.8a16 16 0 0 0-3.2 1C3.6 9.2 3.1 12 3.3 14.7a16 16 0 0 0 4 2l1-1.5a10 10 0 0 1-1.6-.8l.4-.3c3.1 1.4 6.7 1.4 9.8 0l.4.3c-.5.3-1 .6-1.6.8l1 1.5a16 16 0 0 0 4-2c.3-3.2-.5-6-2.3-8.5ZM9.7 13.1c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6Zm4.6 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6Z"
        ></path>
      </svg>
    `,
  },
  {
    label: "GitHub",
    value: "bluemoon012905",
    href: "https://github.com/bluemoon012905",
    icon: `
      <svg viewBox="0 0 24 24" role="img">
        <path
          d="M12 2.3a9.8 9.8 0 0 0-3.1 19.1c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a4 4 0 0 1 1-2.8 3.7 3.7 0 0 1 .1-2.8s.8-.3 2.9 1a10 10 0 0 1 5.2 0c2-1.3 2.9-1 2.9-1a3.7 3.7 0 0 1 .1 2.8 4 4 0 0 1 1 2.8c0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 1.9v2.9c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.3Z"
        ></path>
      </svg>
    `,
  },
  {
    label: "LinkedIn",
    value: "Yuda Wang",
    href: "https://www.linkedin.com/in/yuda-wang-825b691b4/",
    icon: `
      <svg viewBox="0 0 24 24" role="img">
        <rect x="4" y="8.5" width="3.2" height="11.5" class="fill"></rect>
        <circle cx="5.6" cy="5.9" r="1.8" class="fill"></circle>
        <path d="M10 8.5h3v1.6h.1c.4-.8 1.5-1.9 3.4-1.9 3.6 0 4.2 2.2 4.2 5.2V20h-3.2v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3V20H10Z"></path>
      </svg>
    `,
  },
];

function renderAboutHero(site) {
  return `
    <div class="hero-turtle-wrap about-turtle-wrap" aria-hidden="true">
      <img
        class="brand-turtle brand-turtle-desktop about-turtle-desktop"
        src="../assets/images/turtle-variants/turtle_chicken.png"
        alt=""
      />
    </div>
    <div class="hero-nav">
      <div class="brand-mark">
        <span>${escapeHtml(site.contactLabel || "About me")}</span>
        <img
          class="brand-turtle brand-turtle-mobile about-turtle-mobile"
          src="../assets/images/turtle-variants/turtle_chicken.png"
          alt=""
          aria-hidden="true"
        />
      </div>
      <a class="ghost-link" href="/">Back home</a>
    </div>
    <div class="hero-copy">
      <p class="eyebrow">Contact</p>
      <h1 id="about-title">Blue</h1>
      <p id="about-body">${escapeHtml(site.about || "")}</p>
    </div>
  `;
}

function renderEmailLink(email) {
  const safeEmail = escapeHtml(email || "No email set yet.");
  const href = email ? `mailto:${escapeAttribute(email)}` : "#";
  const disabled = email ? "" : " disabled";

  return `
    <div class="contact-link contact-link-row">
      <a id="about-email-link" class="contact-link-main" href="${href}">
        <span class="contact-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M4 7.5h16v9H4z"></path>
            <path d="m4 8 8 6 8-6"></path>
          </svg>
        </span>
        <span>
          <strong>Email</strong>
          <small id="about-email-text">${safeEmail}</small>
        </span>
      </a>
      <button id="copy-email-button" class="copy-email-button" type="button"${disabled}>Copy</button>
    </div>
  `;
}

function renderSocialLinks() {
  return ABOUT_SOCIAL_LINKS.map(
    (link) => `
      <a class="contact-link" href="${escapeAttribute(link.href)}" target="_blank" rel="noreferrer">
        <span class="contact-icon" aria-hidden="true">${link.icon}</span>
        <span>
          <strong>${escapeHtml(link.label)}</strong>
          <small>${escapeHtml(link.value)}</small>
        </span>
      </a>
    `
  ).join("");
}

function renderContactSection(email) {
  return `
    <section class="section" aria-labelledby="reach-out-heading">
      <div class="section-heading">
        <div>
          <h2 id="reach-out-heading">Reach out</h2>
        </div>
      </div>
      <div class="custom-panel-body">
        <div id="contact-links" class="contact-links">
          ${renderEmailLink(email)}
          ${renderSocialLinks()}
        </div>
      </div>
    </section>
  `;
}

function renderAsuSection() {
  return `
    <section class="section asu-panel" aria-labelledby="asu-heading">
      <div class="asu-panel-grid">
        <div class="asu-media-stage" aria-hidden="true">
          <img
            class="asu-photo"
            src="../assets/images/ASU_photo_tempe.png"
            alt=""
          />
          <img
            class="asu-sprite asu-sprite-turtle"
            src="../assets/images/turtle_scholar.png"
            alt=""
          />
          <img
            class="asu-sprite asu-sprite-logo"
            src="../assets/images/ASU_logo.png"
            alt=""
          />
        </div>
        <div class="asu-copy">
          <div class="asu-copy-heading">
            <p class="eyebrow">School</p>
            <h2 id="asu-heading">Arizona State University</h2>
          </div>
          <p>
            I am a computer science undergraduate (2023-2026) at Arizona State
            University, and I am also a master's student in Artificial Intelligence
            Engineering (2026 - 2028).
          </p>
          <p>
            ASU is where most of my technical skills are being built: programming,
            systems thinking/design, and most of all, making stuff.
          </p>
        </div>
      </div>
    </section>
  `;
}

function renderMakingSection() {
  return `
    <section class="section" aria-labelledby="making-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">What I'm making</p>
          <h2 id="making-heading">Projects I keep coming back to</h2>
        </div>
      </div>
      <div class="custom-panel-body">
        <p>Under construction.</p>
      </div>
    </section>
  `;
}

function renderInterestsSection() {
  return `
    <section class="section" aria-labelledby="interests-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Interests</p>
          <h2 id="interests-heading">Things I like outside the assignment brief</h2>
        </div>
      </div>
      <div class="custom-panel-body">
        <p>Under construction.</p>
      </div>
    </section>
  `;
}

function renderAboutPage(site) {
  const rawEmail = String(site.contactHref || "").trim();
  const email = rawEmail.replace(/^mailto:/i, "");

  return {
    hero: renderAboutHero(site),
    sections: [
      renderAsuSection(),
      renderMakingSection(),
      renderInterestsSection(),
      renderContactSection(email),
    ].join(""),
    email,
  };
}

window.BlueshellAboutSections = {
  renderAboutPage,
};
