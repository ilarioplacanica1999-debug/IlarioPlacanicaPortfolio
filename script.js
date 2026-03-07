const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbVid = document.getElementById("lbVid");
const lbFrame = document.getElementById("lbFrame");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");

const items = Array.from(document.querySelectorAll("[data-src][data-gallery]"));
const galleries = new Map();

items.forEach((el) => {
  const g = el.dataset.gallery || "default";
  if (!galleries.has(g)) galleries.set(g, []);
  galleries.get(g).push(el);
});

let currentGallery = null;
let currentIndex = 0;

function isVideoSrc(src) {
  const s = (src || "").toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm");
}

function isTour(src) {
  return (src || "").startsWith("tour:");
}

function tourUrlFromSrc(src) {
  return src.replace("tour:", "").trim();
}

function updateNav() {
  const arr = galleries.get(currentGallery) || [];
  const show = arr.length > 1;
  lbPrev.style.display = show ? "grid" : "none";
  lbNext.style.display = show ? "grid" : "none";
}

function resetMedia() {
  lbImg.style.display = "none";
  lbImg.src = "";

  lbVid.pause();
  lbVid.style.display = "none";
  lbVid.src = "";

  lbFrame.classList.remove("is-tour");
  lbFrame.style.display = "none";
  lbFrame.src = "";
}

function showMedia(src, label) {
  resetMedia();

  if (isTour(src)) {
    lbFrame.style.display = "block";
    lbFrame.classList.add("is-tour");
    lbFrame.src = tourUrlFromSrc(src);
    lbFrame.setAttribute("title", label || "360 Tour");
    return;
  }

  if (isVideoSrc(src)) {
    lbVid.style.display = "block";
    lbVid.src = src;
    lbVid.setAttribute("aria-label", label || "Video");
    lbVid.play().catch(() => {});
    return;
  }

  lbImg.style.display = "block";
  lbImg.src = src;
  lbImg.alt = label || "Image";
}

function openLightbox(galleryKey, index) {
  currentGallery = galleryKey;
  currentIndex = index;

  const arr = galleries.get(currentGallery) || [];
  const el = arr[currentIndex];
  if (!el) return;

  const src = el.dataset.src;
  const label =
    el.dataset.label ||
    el.querySelector(".label")?.textContent?.trim() ||
    "Media";

  showMedia(src, label);

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lb-open");
  updateNav();
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lb-open");
  resetMedia();
}

function go(delta) {
  const arr = galleries.get(currentGallery) || [];
  if (!arr.length) return;

  currentIndex = (currentIndex + delta + arr.length) % arr.length;
  const el = arr[currentIndex];

  const src = el.dataset.src;
  const label =
    el.dataset.label ||
    el.querySelector(".label")?.textContent?.trim() ||
    "Media";

  showMedia(src, label);
  updateNav();
}

items.forEach((el) => {
  el.addEventListener("click", () => {
    const g = el.dataset.gallery || "default";
    const arr = galleries.get(g) || [];
    const idx = arr.indexOf(el);
    openLightbox(g, Math.max(0, idx));
  });
});

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", () => go(-1));
lbNext.addEventListener("click", () => go(+1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "ArrowRight") go(+1);
});
