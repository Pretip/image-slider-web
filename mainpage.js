// Carousel Elements
const wrapper = document.querySelector(".wrapper");
const carousel = document.querySelector(".carousel");
const buttons = document.querySelectorAll(".button");

// Upload Controls
const actualBtn = document.getElementById("actual-btn");
const fileChosen = document.getElementById("file-chosen");
const captionInput = document.getElementById("caption-input");

// Modal Controls
const deleteTriggerBtn = document.getElementById("delete-trigger-btn");
const deleteModal = document.getElementById("delete-modal");
const deletePhotoSelect = document.getElementById("delete-photo-select");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

let imageIndex = 0;
let intervalId;

// --- INDEXEDDB SETUP ---
let db;
const dbRequest = indexedDB.open("PhotoCarouselDB", 1);

dbRequest.onupgradeneeded = (e) => {
  db = e.target.result;
  if (!db.objectStoreNames.contains("photos")) {
    db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
  }
};

dbRequest.onsuccess = (e) => {
  db = e.target.result;
  loadStoredPhotos();
};

dbRequest.onerror = (e) => console.error("IndexedDB error:", e.target.error);

// --- CAROUSEL SLIDER LOGIC ---
const autoSlide = () => {
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    imageIndex++;
    slideImage();
  }, 3000);
};

autoSlide();

const slideImage = () => {
  const slides = carousel.querySelectorAll(".slide");
  if (slides.length === 0) return;

  if (imageIndex >= slides.length) {
    imageIndex = 0;
  } else if (imageIndex < 0) {
    imageIndex = slides.length - 1;
  }

  carousel.style.transform = `translateX(-${imageIndex * 100}%)`;
};

const updateClick = (e) => {
  clearInterval(intervalId);
  const isNext = e.target.id === "next" || e.target.classList.contains("fa-arrow-right");
  imageIndex += isNext ? 1 : -1;
  slideImage();
  autoSlide();
};

buttons.forEach((button) => button.addEventListener("click", updateClick));
wrapper.addEventListener("mouseover", () => clearInterval(intervalId));
wrapper.addEventListener("mouseleave", autoSlide);

// --- RENDER SLIDE IN CAROUSEL ---
function renderCarouselSlide(id, imageSrc, captionText) {
  const carouselSlide = document.createElement("div");
  carouselSlide.classList.add("slide");
  carouselSlide.dataset.photoId = id;

  const carouselImg = document.createElement("img");
  carouselImg.src = imageSrc;
  carouselImg.alt = captionText;

  const carouselCaption = document.createElement("p");
  carouselCaption.classList.add("caption");
  carouselCaption.textContent = captionText;

  carouselSlide.appendChild(carouselImg);
  carouselSlide.appendChild(carouselCaption);
  carousel.appendChild(carouselSlide);
}

// --- SAVE PHOTO TO DB ---
function savePhotoToDB(imageSrc, captionText) {
  const transaction = db.transaction(["photos"], "readwrite");
  const store = transaction.objectStore("photos");

  const addReq = store.add({ imageSrc, captionText });
  addReq.onsuccess = (e) => {
    const id = e.target.result;
    renderCarouselSlide(id, imageSrc, captionText);

    // Jump to the new slide
    const totalSlides = carousel.querySelectorAll(".slide").length;
    imageIndex = totalSlides - 1;
    slideImage();
    autoSlide();
  };
}

// --- LOAD STORED PHOTOS ---
function loadStoredPhotos() {
  const transaction = db.transaction(["photos"], "readonly");
  const store = transaction.objectStore("photos");
  const getAllReq = store.getAll();

  getAllReq.onsuccess = () => {
    const photos = getAllReq.result;
    photos.forEach((p) => renderCarouselSlide(p.id, p.imageSrc, p.captionText));
  };
}

// --- UPLOAD HANDLER ---
actualBtn.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    const selectedFile = this.files[0];
    fileChosen.textContent = selectedFile.name;

    const reader = new FileReader();
    reader.onload = function (e) {
      const imageSrc = e.target.result;
      const customCaptionText = captionInput.value.trim();
      const finalCaption = customCaptionText !== "" ? customCaptionText : selectedFile.name;

      savePhotoToDB(imageSrc, finalCaption);
      captionInput.value = "";
    };

    reader.readAsDataURL(selectedFile);
  } else {
    fileChosen.textContent = "No file chosen";
  }
});

// --- DELETE SELECTION MODAL LOGIC ---
deleteTriggerBtn.addEventListener("click", () => {
  const transaction = db.transaction(["photos"], "readonly");
  const store = transaction.objectStore("photos");
  const getAllReq = store.getAll();

  getAllReq.onsuccess = () => {
    const photos = getAllReq.result;
    deletePhotoSelect.innerHTML = '<option value="" disabled selected>-- Choose a photo --</option>';

    if (photos.length === 0) {
      alert("No uploaded photos available to delete.");
      return;
    }

    photos.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.captionText;
      deletePhotoSelect.appendChild(option);
    });

    deleteModal.classList.add("active");
  };
});

cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.classList.remove("active");
});

confirmDeleteBtn.addEventListener("click", () => {
  const selectedId = parseInt(deletePhotoSelect.value, 10);
  if (!selectedId) {
    alert("Please select a photo to delete.");
    return;
  }

  const transaction = db.transaction(["photos"], "readwrite");
  const store = transaction.objectStore("photos");

  store.delete(selectedId).onsuccess = () => {
    const slideToRemove = carousel.querySelector(`[data-photo-id="${selectedId}"]`);
    if (slideToRemove) slideToRemove.remove();

    deleteModal.classList.remove("active");
    imageIndex = 0;
    slideImage();
  };
});

// Audio Autoplay Handler
const audio = document.getElementById("bg-music");
document.addEventListener(
  "click",
  () => {
    if (audio) {
      audio.play().catch((err) => console.log("Autoplay blocked:", err));
    }
  },
  { once: true }
);