const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const results = document.getElementById("results");
const resultCount = document.getElementById("result-count");
const emptyState = document.querySelector(".empty-state");
const stateSymbol = document.getElementById("state-symbol");
const stateTitle = document.getElementById("state-title");
const stateMessage = document.getElementById("state-message");
const searchButton = document.getElementById("search-button");
let activeSearchController;

function showFeedback(state, title, message, symbol = "✳") {
  emptyState.className = `empty-state${state ? ` state-${state}` : ""}`;
  stateSymbol.textContent = symbol;
  stateTitle.textContent = title;
  stateMessage.textContent = message;
  emptyState.hidden = false;
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) {
    return;
  }

  activeSearchController?.abort();
  const controller = new AbortController();
  activeSearchController = controller;
  results.innerHTML = "";
  results.setAttribute("aria-busy", "true");
  searchButton.disabled = true;
  showFeedback("loading", "Searching…", `Looking for images of “${query}”.`);
  resultCount.textContent = `Searching Wikimedia Commons for “${query}”…`;

  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}%20filetype%3Abitmap&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Image search failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.info ?? "The image search service returned an error");
    }
    const pages = Object.values(data.query?.pages ?? {});

    for (const page of pages) {
      const imageInfo = page.imageinfo?.[0];
      const imageUrl = imageInfo?.thumburl ?? imageInfo?.url
        ?? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(page.title)}`;
      const title = page.title.replace(/^File:/i, "");

      const card = document.createElement("article");
      card.className = "result-card";

      const imageLink = document.createElement("a");
      imageLink.className = "result-image-link";
      imageLink.href = imageInfo?.url ?? imageUrl;
      imageLink.target = "_blank";
      imageLink.rel = "noopener noreferrer";
      imageLink.setAttribute("aria-label", `Open full image: ${title}`);

      const image = document.createElement("img");
      image.className = "result-image";
      image.src = imageUrl;
      image.alt = title;
      image.loading = "lazy";
      imageLink.appendChild(image);

      const caption = document.createElement("p");
      caption.className = "result-title";
      caption.textContent = title;

      card.appendChild(imageLink);
      card.appendChild(caption);
      results.appendChild(card);
    }

    if (pages.length) {
      emptyState.hidden = true;
      resultCount.textContent = `Showing ${pages.length} results for “${query}”`;
    } else {
      showFeedback("empty", "No images found.", `No results for “${query}”. Try another search.`);
      resultCount.textContent = `No results for “${query}”`;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    console.error(error);
    showFeedback("error", "We couldn't load those images.", "Something went wrong. Please check your connection and try again.", "!");
    resultCount.textContent = "Could not load images. Please try again.";
  } finally {
    if (activeSearchController === controller) {
      activeSearchController = undefined;
      searchButton.disabled = false;
      results.setAttribute("aria-busy", "false");
    }
  }
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.dataset.query;
    searchForm.requestSubmit();
  });
});
