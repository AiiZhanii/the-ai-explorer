const COVER = "cover.png";
const BACK_COVER = "back.png";

const bookElement = document.getElementById("book");
const pageLabel = document.getElementById("page-label");
const pageCount = document.getElementById("page-count");
const statusLabel = document.getElementById("reader-status");
const openButton = document.getElementById("open-button");
let pageFlip;

function makeImagePage(src, className, alt) {
  const page = document.createElement("div");
  page.className = `page ${className}`;
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  page.append(image);
  return page;
}

function makeSpreadPage(src, side, label) {
  const page = document.createElement("div");
  page.className = `page spread-page spread-${side}`;
  page.setAttribute("aria-label", label);
  const image = document.createElement("img");
  image.className = "spread-art";
  image.src = src;
  image.alt = "";
  image.draggable = false;
  page.append(image);
  return page;
}

function updateReader() {
  const current = pageFlip.getCurrentPageIndex();
  if (current === 0) {
    pageLabel.textContent = "COVER";
    statusLabel.textContent = "READY TO EXPLORE";
    openButton.hidden = false;
    return;
  }
  const firstPage = current;
  const lastPage = Math.min(current + (pageFlip.getOrientation() === "portrait" ? 0 : 1), 32);
  pageLabel.textContent = firstPage === lastPage ? `PAGE ${firstPage}` : `PAGES ${firstPage}–${lastPage}`;
  statusLabel.textContent = "YOUR JOURNEY THROUGH AI";
  openButton.hidden = true;
}

function imageExists(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

async function findAvailableSpreads() {
  const filenames = Array.from({ length: 16 }, (_, index) => {
    const first = index * 2 + 1;
    return `page${first}${first + 1}.png`;
  });
  const checks = await Promise.all(filenames.map(async (filename) => ({
    filename,
    exists: await imageExists(filename),
  })));
  return checks.filter((item) => item.exists).map((item) => item.filename);
}

async function initializeBook() {
  if (!window.St || !window.St.PageFlip) {
    statusLabel.textContent = "BOOK LIBRARY DID NOT LOAD";
    return;
  }

  const spreads = await findAvailableSpreads();
  bookElement.append(makeImagePage(COVER, "cover-page", "The AI Explorer cover"));
  spreads.forEach((src, index) => {
    const first = index * 2 + 1;
    bookElement.append(makeSpreadPage(src, "left", `Page ${first}`));
    bookElement.append(makeSpreadPage(src, "right", `Page ${first + 1}`));
  });
  if (spreads.length < 16) {
    // Preserve the correct final-book structure while pages are still being added.
    const missingPages = 32 - spreads.length * 2;
    for (let i = 0; i < missingPages; i++) {
      const page = document.createElement("div");
      page.className = "page page-coming-soon";
      page.textContent = "More pages coming soon";
      bookElement.append(page);
    }
  }
  if (await imageExists(BACK_COVER)) {
    bookElement.append(makeImagePage(BACK_COVER, "back-cover", "Back cover"));
  } else {
    const backPage = document.createElement("div");
    backPage.className = "page back-cover-placeholder";
    backPage.innerHTML = "<span>THE AI EXPLORER</span><small>END OF THE JOURNEY — FOR NOW</small>";
    bookElement.append(backPage);
  }

  pageFlip = new St.PageFlip(bookElement, {
    width: 960,
    height: 1080,
    size: "stretch",
    minWidth: 280,
    maxWidth: 960,
    minHeight: 315,
    maxHeight: 1080,
    drawShadow: true,
    flippingTime: 800,
    usePortrait: true,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 0.28,
    showCover: true,
    mobileScrollSupport: true,
    clickEventForward: true,
    useMouseEvents: true,
    swipeDistance: 24,
  });
  pageFlip.loadFromHTML(bookElement.querySelectorAll(".page"));
  pageFlip.on("flip", updateReader);
  pageFlip.on("init", updateReader);

  openButton.addEventListener("click", () => pageFlip.flipNext());
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") pageFlip.flipNext();
    if (event.key === "ArrowLeft") pageFlip.flipPrev();
  });
  document.body.classList.remove("is-loading");
}

document.body.classList.add("is-loading");
window.addEventListener("load", initializeBook, { once: true });
