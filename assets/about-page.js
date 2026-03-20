loadAbout().catch(() => {
  document.getElementById("about-title").textContent = "About me";
  document.getElementById("about-body").textContent = "Could not load site content.";
  document.getElementById("about-email-text").textContent = "Email unavailable.";
});

async function loadAbout() {
  const response = await fetch("../data/content.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load page content.");
  }

  const content = await response.json();
  const site = content.site || {};
  const rawEmail = String(site.contactHref || "").trim();
  const email = rawEmail.replace(/^mailto:/i, "");

  document.title = `${site.contactLabel || "About me"} | Blue`;
  document.getElementById("about-title").textContent = "Blue";
  document.getElementById("about-body").textContent = site.about || "";
  document.getElementById("about-email-text").textContent = email || "No email set yet.";

  const emailLink = document.getElementById("about-email-link");
  emailLink.href = email ? `mailto:${email}` : "#";

  const copyButton = document.getElementById("copy-email-button");
  copyButton.disabled = !email;
  copyButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!email) {
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      copyButton.textContent = "Copied";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1600);
    } catch (error) {
      copyButton.textContent = "Failed";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1600);
    }
  });
}
