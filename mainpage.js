console.log("mainpage.js loaded successfully!");

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://mhepoohjzxonhwchsbwz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZXBvb2hqenhvbmh3Y2hzYnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDg0MzksImV4cCI6MjEwMTQ4NDQzOX0.zjubT556h1Vh2njYpeMLwiDnyhoRJqhdLH3codpFvyc";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// --- FETCH & LISTEN FOR SUPABASE PHOTOS ---
async function loadPhotos() {
  // FIXED: Changed supabase to supabaseClient
  const { data: photos, error } = await supabaseClient
    .from("photos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading photos:", error);
    return;
  }

  carousel.innerHTML = "";
  
  if (photos.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "20px";
    emptyMsg.textContent = "No photos uploaded yet. Upload one below!";
    carousel.appendChild(emptyMsg);
    return;
  }

  photos.forEach((p) => renderCarouselSlide(p.id, p.image_src, p.caption_text));
  slideImage();
}

// FIXED: Changed supabase to supabaseClient
supabaseClient
  .channel("public:photos")
  .on("postgres_changes", { event: "*", schema: "public", table: "photos" }, () => {
    loadPhotos();
  })
  .subscribe();

// Initial load on page startup
loadPhotos();

// --- UPLOAD HANDLER ---
actualBtn.addEventListener("change", async function () {
  console.log("File change event triggered!");

  if (this.files && this.files[0]) {
    const file = this.files[0];
    console.log("Selected file:", file.name);
    fileChosen.textContent = file.name;

    const customCaptionText = captionInput.value.trim();
    const finalCaption = customCaptionText !== "" ? customCaptionText : file.name;

    try {
      const fileName = `${Date.now()}_${file.name}`;
      console.log("Uploading to Supabase Storage...");

      // FIXED: Changed supabase to supabaseClient
      const { data: storageData, error: storageError } = await supabaseClient.storage
        .from("photos")
        .upload(fileName, file);

      if (storageError) {
        console.error("Storage upload error:", storageError);
        throw storageError;
      }

      console.log("Storage upload successful!");

      // FIXED: Changed supabase to supabaseClient
      const { data: publicUrlData } = supabaseClient.storage
        .from("photos")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log("Public URL generated:", publicUrl);

      // Save metadata to Postgres database
      const { error: dbError } = await supabaseClient.from("photos").insert([
        {
          image_src: publicUrl,
          caption_text: finalCaption,
          storage_path: fileName,
        },
      ]);

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log("Database entry saved!");

      captionInput.value = "";
      fileChosen.textContent = "No file chosen";
      actualBtn.value = "";
    } catch (error) {
      console.error("Full upload error:", error);
      alert("Failed to upload photo: " + error.message);
    }
  } else {
    console.log("No file selected.");
  }
});

// --- DELETE LOGIC ---
deleteTriggerBtn.addEventListener("click", async () => {
  const { data: photos, error } = await supabaseClient.from("photos").select("*");

  if (error) {
    console.error("Error fetching photos for delete:", error);
    return;
  }

  deletePhotoSelect.innerHTML = '<option value="" disabled selected>-- Choose a photo --</option>';

  if (!photos || photos.length === 0) {
    alert("No uploaded photos available to delete.");
    return;
  }

  photos.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.dataset.storagePath = p.storage_path;
    option.textContent = p.caption_text;
    deletePhotoSelect.appendChild(option);
  });

  deleteModal.classList.add("active");
});

cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.classList.remove("active");
});

confirmDeleteBtn.addEventListener("click", async () => {
  const selectedOption = deletePhotoSelect.options[deletePhotoSelect.selectedIndex];
  const photoId = selectedOption.value;
  const storagePath = selectedOption.dataset.storagePath;

  if (!photoId) {
    alert("Please select a photo to delete.");
    return;
  }

  try {
    // 1. Delete file from Storage bucket
    if (storagePath) {
      await supabaseClient.storage.from("photos").remove([storagePath]);
    }

    // 2. Delete row from Database
    const { error } = await supabaseClient.from("photos").delete().eq("id", photoId);
    if (error) throw error;

    deleteModal.classList.remove("active");
    imageIndex = 0;
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete photo.");
  }
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