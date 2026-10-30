const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const results = document.getElementById("results");
const resultCount = document.getElementById("result-count");
const emptyState = document.querySelector(".empty-state");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) {
    return;
  }

  results.innerHTML = "";
  emptyState.hidden = false;
  resultCount.textContent = `Searching Wikimedia Commons for “${query}”…`;

  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}%20filetype%3Abitmap&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Image search failed with status ${response.status}`);
    }

    const data = await response.json();
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

    emptyState.hidden = pages.length > 0;
    resultCount.textContent = pages.length
      ? `Showing ${pages.length} results for “${query}”`
      : `No images found for “${query}”`;
  } catch (error) {
    console.error(error);
    resultCount.textContent = "Could not load images. Please try again.";
  }
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    searchInput.value = chip.dataset.query;
    searchForm.requestSubmit();
  });
});
