const galleryImages = [
  // TODO: Add up to 40 image filenames in assets/images/
  // "work-01.jpg",
  // "work-02.jpg"
];

const galleryFrame = document.getElementById("galleryFrame");
const galleryImage = document.getElementById("galleryImage");
const galleryPlaceholder = document.getElementById("galleryPlaceholder");
const galleryThumbs = document.getElementById("galleryThumbs");
const prevBtn = document.querySelector(".gallery-nav.prev");
const nextBtn = document.querySelector(".gallery-nav.next");

const modal = document.getElementById("galleryModal");
const modalImage = document.getElementById("modalImage");
const modalClose = document.querySelector(".modal-close");
const modalPrev = document.querySelector(".modal-nav.prev");
const modalNext = document.querySelector(".modal-nav.next");

const floatingCall = document.getElementById("floatingCall");
const copyButtons = document.querySelectorAll("[data-copy]");

let currentIndex = 0;
let intervalId = null;
let userInteracted = false;
let lastFocused = null;

function setGalleryImage(index) {
  if (!galleryImages.length) {
    galleryFrame.classList.remove("has-image");
    galleryPlaceholder.style.display = "block";
    galleryImage.removeAttribute("src");
    return;
  }

  const imageName = galleryImages[index];
  galleryImage.src = `assets/images/${imageName}`;
  galleryImage.alt = `Work gallery image ${index + 1}`;
  galleryFrame.classList.add("has-image");
  galleryPlaceholder.style.display = "none";

  Array.from(galleryThumbs.children).forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });
}

function buildThumbs() {
  if (!galleryImages.length) {
    galleryThumbs.innerHTML = "";
    return;
  }

  galleryThumbs.innerHTML = galleryImages
    .map(
      (img, i) =>
        `<button class="gallery-thumb" type="button" data-index="${i}"><img src="assets/images/${img}" alt="Thumbnail ${i + 1}" /></button>`
    )
    .join("");
}

function goToImage(direction) {
  if (!galleryImages.length) return;
  currentIndex = (currentIndex + direction + galleryImages.length) % galleryImages.length;
  setGalleryImage(currentIndex);
}

function startAutoRotate() {
  if (!galleryImages.length || userInteracted) return;
  stopAutoRotate();
  intervalId = window.setInterval(() => {
    goToImage(1);
  }, 5000);
}

function stopAutoRotate() {
  if (intervalId) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function openModal() {
  if (!galleryImages.length) return;
  modal.classList.add("open");
  document.body.classList.add("hide-action-bar");
  modal.setAttribute("aria-hidden", "false");
  modalImage.src = galleryImage.src;
  lastFocused = document.activeElement;
  modalClose.focus();
}

function closeModal() {
  modal.classList.remove("open");
  document.body.classList.remove("hide-action-bar");
  modal.setAttribute("aria-hidden", "true");
  if (lastFocused) {
    lastFocused.focus();
  }
}

function updateModal(direction) {
  goToImage(direction);
  modalImage.src = galleryImage.src;
}

function setupGallery() {
  buildThumbs();
  setGalleryImage(currentIndex);
  startAutoRotate();
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    userInteracted = true;
    stopAutoRotate();
    goToImage(-1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    userInteracted = true;
    stopAutoRotate();
    goToImage(1);
  });
}

if (galleryThumbs) {
  galleryThumbs.addEventListener("click", (event) => {
    const target = event.target.closest(".gallery-thumb");
    if (!target) return;
    userInteracted = true;
    stopAutoRotate();
    currentIndex = Number(target.dataset.index);
    setGalleryImage(currentIndex);
  });
}

galleryFrame.addEventListener("mouseenter", stopAutoRotate);
galleryFrame.addEventListener("mouseleave", startAutoRotate);

galleryFrame.addEventListener("click", () => {
  userInteracted = true;
  stopAutoRotate();
  openModal();
});

galleryFrame.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    userInteracted = true;
    stopAutoRotate();
    openModal();
  }
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

modalPrev.addEventListener("click", () => updateModal(-1));
modalNext.addEventListener("click", () => updateModal(1));

document.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("open")) return;
  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowLeft") updateModal(-1);
  if (event.key === "ArrowRight") updateModal(1);
});

if (floatingCall) {
  floatingCall.addEventListener("click", () => {
    window.location.href = "tel:07790714880";
  });
}

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = value;
      }, 2000);
    } catch (error) {
      button.textContent = value;
    }
  });
});

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const formStartTime = Date.now();

function setError(name, message) {
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (errorEl) {
    errorEl.textContent = message || "";
  }
}

function validateEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const requiredFields = ["name", "phone", "postcode", "message"];
    let valid = true;

    requiredFields.forEach((field) => {
      const value = (payload[field] || "").trim();
      if (!value) {
        setError(field, "This field is required.");
        valid = false;
      } else {
        setError(field, "");
      }
    });

    if (!validateEmail(payload.email)) {
      setError("email", "Enter a valid email address.");
      valid = false;
    } else {
      setError("email", "");
    }

    if (!payload.consent) {
      setError("consent", "Consent is required.");
      valid = false;
    } else {
      setError("consent", "");
    }

    if (!valid) {
      statusEl.textContent = "Please fix the highlighted fields.";
      statusEl.style.color = "#c0152f";
      return;
    }

    statusEl.textContent = "Sending...";
    statusEl.style.color = "inherit";

    payload.emergency = !!payload.emergency;
    payload.timeSinceLoad = Date.now() - formStartTime;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.ok) {
        statusEl.textContent = "Thanks — we’ll contact you ASAP.";
        statusEl.style.color = "#1b7d4f";
        form.reset();
      } else {
        throw new Error(result.error || "Something went wrong");
      }
    } catch (error) {
      statusEl.textContent =
        "We couldn’t send your request. Please call 07790 714880 or email shkelzen_naza@hotmail.co.uk.";
      statusEl.style.color = "#c0152f";
    }
  });
}

setupGallery();
