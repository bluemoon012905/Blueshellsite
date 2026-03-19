const BlueshellContent = {
  DEFAULT_HOME_PANELS: [
    {
      id: "outline",
      type: "category-overview",
      eyebrow: "Outline",
      title: "Four rooms, one archive.",
      description: "",
      enabled: true,
    },
    {
      id: "featured",
      type: "featured-posts",
      eyebrow: "Featured",
      title: "Current highlights",
      description: "",
      enabled: true,
    },
    {
      id: "archive",
      type: "archive-posts",
      eyebrow: "Archive",
      title: "Browse everything",
      description: "",
      enabled: true,
    },
  ],

  ensureHomePanels(content, defaults = null) {
    const basePanels = defaults || BlueshellContent.DEFAULT_HOME_PANELS;
    const currentPanels = Array.isArray(content.site?.homepagePanels) ? content.site.homepagePanels : [];
    const customPanels = currentPanels.filter((panel) => !basePanels.some((preset) => preset.id === panel.id));

    content.site.homepagePanels = [
      ...basePanels.map((preset) => ({
        ...preset,
        ...currentPanels.find((panel) => panel.id === preset.id),
      })),
      ...customPanels,
    ];

    return content.site.homepagePanels;
  },

  byNewestDate(left, right) {
    return new Date(right.date) - new Date(left.date);
  },

  formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  renderMarkdown(markdown) {
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
        fragments.push(`<h3>${BlueshellContent.escapeHtml(line.slice(4))}</h3>`);
        continue;
      }

      if (line.startsWith("## ")) {
        flushList();
        fragments.push(`<h2>${BlueshellContent.escapeHtml(line.slice(3))}</h2>`);
        continue;
      }

      if (line.startsWith("- ")) {
        listItems.push(BlueshellContent.escapeHtml(line.slice(2)));
        continue;
      }

      flushList();
      fragments.push(`<p>${BlueshellContent.escapeHtml(line)}</p>`);
    }

    flushList();
    return fragments.join("");
  },

  sanitizeRichHtml(html) {
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
  },

  renderPostBody(post) {
    if (post.bodyFormat === "html") {
      return BlueshellContent.sanitizeRichHtml(post.body || "");
    }
    return BlueshellContent.renderMarkdown(post.body || "");
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },

  escapeAttribute(value) {
    return BlueshellContent.escapeHtml(value);
  },
};

window.BlueshellContent = BlueshellContent;
