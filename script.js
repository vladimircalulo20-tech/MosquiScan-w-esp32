// ============================================================
// MOSQUISCAN
// Smartphone-Based AI System for Detecting Potential
// Mosquito Breeding Sites
// ============================================================

// =========================
// CONFIGURATION
// =========================

// Put your ESP32 IP address here.
// Example: const ESP32_IP = "192.168.1.45";
const ESP32_IP = "";

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";

// =========================
// GLOBAL VARIABLES
// =========================

let model = null;
let imageData = null;

let currentAIResult = null;
let currentConfidence = null;
let currentReason = null;

let currentMarker = null;
let map = null;

let records = JSON.parse(localStorage.getItem("mosquiscanRecords")) || [];


// =========================
// PAGE INITIALIZATION
// =========================

document.addEventListener("DOMContentLoaded", () => {

  initializeMap();
  updateDashboard();
  displaySavedRecords();

  const imageInput = document.getElementById("imageInput");

  if (imageInput) {
    imageInput.addEventListener("change", handleImageUpload);
  }

  const classifyButton = document.getElementById("classifyButton");

  if (classifyButton) {
    classifyButton.addEventListener("click", analyzeImage);
  }

  const sendButton = document.getElementById("sendLedButton");

  if (sendButton) {
    sendButton.addEventListener("click", sendResultToESP32);
  }

  const saveButton = document.getElementById("saveButton");

  if (saveButton) {
    saveButton.addEventListener("click", saveInspection);
  }

  const locationButton = document.getElementById("locationButton");

  if (locationButton) {
    locationButton.addEventListener("click", getCurrentLocation);
  }

  const clearLocationButton = document.getElementById("clearLocationButton");

  if (clearLocationButton) {
    clearLocationButton.addEventListener("click", clearLocation);
  }

});


// ============================================================
// MAP
// ============================================================

function initializeMap() {

  const mapElement = document.getElementById("map");

  if (!mapElement) return;

  map = L.map("map").setView([9.8190, 124.4970], 13);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

}


// ============================================================
// IMAGE UPLOAD / CAMERA
// ============================================================

function handleImageUpload(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    imageData = e.target.result;

    const preview = document.getElementById("imagePreview");
    const previewArea = document.getElementById("previewArea");

    if (preview) {
      preview.src = imageData;
      preview.style.display = "block";
    }

    if (previewArea) {
      previewArea.classList.remove("hidden");
    }

    // Reset previous AI result
    currentAIResult = null;
    currentConfidence = null;
    currentReason = null;

    const aiResult = document.getElementById("aiResult");

    if (aiResult) {
      aiResult.textContent = "Ready to analyze";
    }

    const confidence = document.getElementById("confidence");

    if (confidence) {
      confidence.textContent = "Click Analyze Image.";
    }

    const reason = document.getElementById("reason");

    if (reason) {
      reason.textContent = "The reason will appear after the image is analyzed.";
    }

    const resultIcon = document.getElementById("resultIcon");

    if (resultIcon) {
      resultIcon.className = "result-icon";
      resultIcon.textContent = "?";
    }

    const classifyButton = document.getElementById("classifyButton");

    if (classifyButton) {
      classifyButton.disabled = false;
    }

    const sendButton = document.getElementById("sendLedButton");

    if (sendButton) {
      sendButton.disabled = true;
    }

    const saveButton = document.getElementById("saveButton");

    if (saveButton) {
      saveButton.disabled = true;
    }

  };

  reader.readAsDataURL(file);

}


// ============================================================
// LOAD TEACHABLE MACHINE MODEL
// ============================================================

async function loadModel() {

  if (model) {
    return model;
  }

  try {

    showMessage("Loading AI model...", "normal");

    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);

    showMessage("AI model loaded successfully.", "normal");

    return model;

  } catch (error) {

    console.error("AI model loading error:", error);

    showMessage(
      "Unable to load the AI model. Check your internet connection and model URL.",
      "error"
    );

    return null;
  }

}


// ============================================================
// ANALYZE IMAGE
// ============================================================

async function analyzeImage() {

  if (!imageData) {

    showMessage(
      "Please capture or upload an image first.",
      "error"
    );

    return;
  }

  const preview = document.getElementById("imagePreview");

  if (!preview) return;

  const classifyButton = document.getElementById("classifyButton");

  if (classifyButton) {
    classifyButton.disabled = true;
    classifyButton.textContent = "Analyzing...";
  }

  try {

    const loadedModel = await loadModel();

    if (!loadedModel) {
      throw new Error("AI model could not be loaded.");
    }

    const predictions = await loadedModel.predict(preview);

    if (!predictions || predictions.length === 0) {
      throw new Error("No prediction was returned.");
    }

    // Find prediction with highest probability
    let bestPrediction = predictions[0];

    for (let i = 1; i < predictions.length; i++) {

      if (
        predictions[i].probability >
        bestPrediction.probability
      ) {

        bestPrediction = predictions[i];

      }

    }

    const className = bestPrediction.className;

    const confidence =
      bestPrediction.probability * 100;

    // Normalize class names
    const normalized =
      className.toLowerCase().trim();

    if (
      normalized.includes("not") &&
      normalized.includes("possible")
    ) {

      currentAIResult =
        "Not a Possible Breeding Site";

    } else if (
      normalized.includes("possible")
    ) {

      currentAIResult =
        "Possible Breeding Site";

    } else {

      currentAIResult = className;

    }

    currentConfidence = confidence;

    currentReason = generateReason(currentAIResult);

    displayAIResult();

    // Enable buttons
    const sendButton =
      document.getElementById("sendLedButton");

    if (sendButton) {
      sendButton.disabled = false;
    }

    const saveButton =
      document.getElementById("saveButton");

    if (saveButton) {
      saveButton.disabled = false;
    }

    showMessage(
      "Image analyzed successfully.",
      "normal"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      "An error occurred while analyzing the image.",
      "error"
    );

  } finally {

    if (classifyButton) {

      classifyButton.disabled = false;

      classifyButton.textContent =
        "Analyze Image";

    }

  }

}


// ============================================================
// DISPLAY AI RESULT
// ============================================================

function displayAIResult() {

  const aiResult =
    document.getElementById("aiResult");

  const confidence =
    document.getElementById("confidence");

  const reason =
    document.getElementById("reason");

  const resultIcon =
    document.getElementById("resultIcon");


  if (aiResult) {

    aiResult.textContent =
      currentAIResult;

  }


  if (confidence) {

    confidence.textContent =
      "Confidence: " +
      currentConfidence.toFixed(2) +
      "%";

  }


  if (reason) {

    reason.textContent =
      currentReason;

  }


  if (resultIcon) {

    if (
      currentAIResult ===
      "Possible Breeding Site"
    ) {

      resultIcon.className =
        "result-icon possible";

      resultIcon.textContent = "🔴";

    } else {

      resultIcon.className =
        "result-icon not-possible";

      resultIcon.textContent = "🟢";

    }

  }

}


// ============================================================
// GENERATE REASON
// ============================================================

function generateReason(result) {

  if (
    result ===
    "Possible Breeding Site"
  ) {

    return (
      "The image shows visual conditions that may " +
      "support mosquito breeding, such as stagnant " +
      "or standing water retained in a water-holding object."
    );

  }

  if (
    result ===
    "Not a Possible Breeding Site"
  ) {

    return (
      "The image does not show clear visual conditions " +
      "associated with a potential mosquito-breeding site, " +
      "such as stagnant water retained in a suitable container."
    );

  }

  return "No classification reason is available.";

}


// ============================================================
// SEND RESULT TO ESP32
// ============================================================

async function sendResultToESP32() {

  if (!ESP32_IP) {

    setESPStatus(
      "Not Configured",
      "error"
    );

    showMessage(
      "ESP32 IP is empty. Add its IP address in script.js.",
      "error"
    );

    return false;
  }


  if (!currentAIResult) {

    showMessage(
      "Analyze an image first.",
      "error"
    );

    return false;
  }


  let endpoint = "";


  if (
    currentAIResult ===
    "Possible Breeding Site"
  ) {

    endpoint = "/possible";

  } else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    endpoint = "/not-possible";

  } else {

    showMessage(
      "The AI result is not recognized by the ESP32.",
      "error"
    );

    return false;

  }


  try {

    setESPStatus(
      "Connecting...",
      "normal"
    );


    const response = await fetch(
      "http://" +
      ESP32_IP +
      endpoint,
      {
        method: "GET",
        cache: "no-store"
      }
    );


    if (!response.ok) {

      throw new Error(
        "ESP32 returned HTTP " +
        response.status
      );

    }


    const text =
      await response.text();


    setESPStatus(
      "Connected",
      "connected"
    );


    showMessage(
      "ESP32 received: " + text,
      "normal"
    );


    return true;


  } catch (error) {

    console.error(
      "ESP32 connection error:",
      error
    );


    setESPStatus(
      "Connection Failed",
      "error"
    );


    showMessage(
      "Could not connect to the ESP32. Make sure the ESP32 and smartphone are connected to the same Wi-Fi network.",
      "error"
    );


    return false;

  }

}


// ============================================================
// ESP32 STATUS
// ============================================================

function setESPStatus(status, type) {

  const statusText =
    document.getElementById("espStatus");

  const statusDot =
    document.getElementById("espDot");


  if (statusText) {

    statusText.textContent =
      "ESP32: " + status;

  }


  if (statusDot) {

    statusDot.className =
      "status-dot " + type;

  }

}


// ============================================================
// CURRENT LOCATION
// ============================================================

function getCurrentLocation() {

  if (!navigator.geolocation) {

    showMessage(
      "Geolocation is not supported by this browser.",
      "error"
    );

    return;
  }


  showMessage(
    "Getting your current location...",
    "normal"
  );


  navigator.geolocation.getCurrentPosition(

    function(position) {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      const latitudeInput =
        document.getElementById("latitude");

      const longitudeInput =
        document.getElementById("longitude");


      if (latitudeInput) {

        latitudeInput.value =
          latitude.toFixed(6);

      }


      if (longitudeInput) {

        longitudeInput.value =
          longitude.toFixed(6);

      }


      if (map) {

        map.setView(
          [latitude, longitude],
          17
        );


        if (currentMarker) {

          map.removeLayer(
            currentMarker
          );

        }


        currentMarker =
          L.marker(
            [latitude, longitude]
          ).addTo(map);


        currentMarker.bindPopup(
          "Current Inspection Location"
        ).openPopup();

      }


      showMessage(
        "Current location added.",
        "normal"
      );

    },


    function(error) {

      console.error(
        "Location error:",
        error
      );


      showMessage(
        "Unable to get your location. Please enter the latitude and longitude manually.",
        "error"
      );

    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

  );

}


// ============================================================
// CLEAR LOCATION
// ============================================================

function clearLocation() {

  const latitude =
    document.getElementById("latitude");

  const longitude =
    document.getElementById("longitude");


  if (latitude) {
    latitude.value = "";
  }


  if (longitude) {
    longitude.value = "";
  }


  if (currentMarker && map) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }


  showMessage(
    "Location cleared.",
    "normal"
  );

}


// ============================================================
// SAVE INSPECTION
// ============================================================

function saveInspection() {

  if (!imageData) {

    showMessage(
      "Please capture or upload an image first.",
      "error"
    );

    return;
  }


  if (!currentAIResult) {

    showMessage(
      "Please analyze the image first.",
      "error"
    );

    return;
  }


  const latitude =
    document.getElementById("latitude")?.value || "";

  const longitude =
    document.getElementById("longitude")?.value || "";

  const notes =
    document.getElementById("notes")?.value || "";


  const record = {

    id: Date.now(),

    image: imageData,

    result: currentAIResult,

    confidence: currentConfidence,

    reason: currentReason,

    latitude: latitude,

    longitude: longitude,

    notes: notes,

    date: new Date().toLocaleString()

  };


  records.push(record);


  localStorage.setItem(
    "mosquiscanRecords",
    JSON.stringify(records)
  );


  // Add marker to map
  addRecordMarker(record);


  // Update dashboard
  updateDashboard();


  // Update saved records section
  displaySavedRecords();


  // Clear the form AFTER saving
  clearInspectionForm();


  showMessage(
    "Inspection saved successfully. Ready for the next inspection.",
    "normal"
  );

}


// ============================================================
// ADD RECORD MARKER
// ============================================================

function addRecordMarker(record) {

  if (!map) return;

  if (
    !record.latitude ||
    !record.longitude
  ) {

    return;

  }


  const lat =
    parseFloat(record.latitude);

  const lng =
    parseFloat(record.longitude);


  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {

    return;

  }


  let markerColor;


  if (
    record.result ===
    "Possible Breeding Site"
  ) {

    markerColor = "red";

  } else {

    markerColor = "green";

  }


  const icon =
    L.divIcon({

      className: "custom-map-marker",

      html:
        `<div class="map-marker ${markerColor}"></div>`,

      iconSize: [20, 20],

      iconAnchor: [10, 10]

    });


  const marker =
    L.marker(
      [lat, lng],
      { icon: icon }
    ).addTo(map);


  const imageHTML =
    record.image
      ? `<img src="${record.image}" 
          style="width:120px;height:80px;object-fit:cover;border-radius:8px;margin-top:8px;">`
      : "";


  marker.bindPopup(`

    <div style="max-width:180px;">

      <strong>
        ${record.result}
      </strong>

      <br>

      Confidence:
      ${Number(record.confidence).toFixed(2)}%

      <br>

      ${imageHTML}

      <br>

      <small>
        ${record.date}
      </small>

    </div>

  `);

}


// ============================================================
// DISPLAY ALL SAVED MARKERS
// ============================================================

function displaySavedRecords() {

  if (!map) return;


  records.forEach(
    function(record) {

      addRecordMarker(record);

    }
  );

}


// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard() {

  const totalRecords =
    document.getElementById("totalRecords");

  const possibleSites =
    document.getElementById("possibleSites");

  const notPossibleSites =
    document.getElementById("notPossibleSites");


  const possibleCount =
    records.filter(
      record =>
        record.result ===
        "Possible Breeding Site"
    ).length;


  const notPossibleCount =
    records.filter(
      record =>
        record.result ===
        "Not a Possible Breeding Site"
    ).length;


  if (totalRecords) {

    totalRecords.textContent =
      records.length;

  }


  if (possibleSites) {

    possibleSites.textContent =
      possibleCount;

  }


  if (notPossibleSites) {

    notPossibleSites.textContent =
      notPossibleCount;

  }

}


// ============================================================
// DISPLAY SAVED RECORDS
// ============================================================

function displaySavedRecords() {

  const container =
    document.getElementById("recordsContainer");


  if (!container) return;


  container.innerHTML = "";


  if (records.length === 0) {

    container.innerHTML = `
      <div class="empty-records">
        No inspection records yet.
      </div>
    `;

    return;

  }


  // Newest record first
  const reversedRecords =
    [...records].reverse();


  reversedRecords.forEach(
    function(record) {

      const card =
        document.createElement("div");


      card.className =
        "record-card";


      const resultClass =
        record.result ===
        "Possible Breeding Site"
          ? "possible"
          : "not-possible";


      card.innerHTML = `

        <div class="record-image">

          ${
            record.image
              ? `<img src="${record.image}" 
                  alt="Inspection Image">`
              : ""
          }

        </div>


        <div class="record-content">

          <div class="record-result ${resultClass}">
            ${record.result}
          </div>


          <div class="record-confidence">

            Confidence:
            ${Number(record.confidence).toFixed(2)}%

          </div>


          <div class="record-reason">

            <strong>Reason:</strong>

            ${record.reason || "No reason recorded."}

          </div>


          <div class="record-location">

            <strong>Location:</strong>

            ${
              record.latitude &&
              record.longitude
                ? `${record.latitude}, ${record.longitude}`
                : "No location recorded."
            }

          </div>


          <div class="record-notes">

            <strong>Notes:</strong>

            ${record.notes || "No notes."}

          </div>


          <div class="record-date">

            ${record.date}

          </div>

        </div>

      `;


      container.appendChild(card);

    }
  );

}


// ============================================================
// CLEAR INSPECTION FORM
// ============================================================

function clearInspectionForm() {

  // Clear image input
  const imageInput =
    document.getElementById("imageInput");


  if (imageInput) {

    imageInput.value = "";

  }


  // Clear image preview
  const preview =
    document.getElementById("imagePreview");


  if (preview) {

    preview.src = "";

    preview.style.display =
      "none";

  }


  // Hide preview area
  const previewArea =
    document.getElementById("previewArea");


  if (previewArea) {

    previewArea.classList.add(
      "hidden"
    );

  }


  // Reset AI result
  const aiResult =
    document.getElementById("aiResult");


  if (aiResult) {

    aiResult.textContent =
      "No result yet";

  }


  // Reset confidence
  const confidence =
    document.getElementById("confidence");


  if (confidence) {

    confidence.textContent =
      "Upload an image to begin.";

  }


  // Reset reason
  const reason =
    document.getElementById("reason");


  if (reason) {

    reason.textContent =
      "The reason will appear after the image is analyzed.";

  }


  // Reset result icon
  const resultIcon =
    document.getElementById("resultIcon");


  if (resultIcon) {

    resultIcon.className =
      "result-icon";

    resultIcon.textContent =
      "?";

  }


  // Clear latitude
  const latitude =
    document.getElementById("latitude");


  if (latitude) {

    latitude.value = "";

  }


  // Clear longitude
  const longitude =
    document.getElementById("longitude");


  if (longitude) {

    longitude.value = "";

  }


  // Clear notes
  const notes =
    document.getElementById("notes");


  if (notes) {

    notes.value = "";

  }


  // Disable Analyze button
  const analyzeButton =
    document.getElementById("classifyButton");


  if (analyzeButton) {

    analyzeButton.disabled = true;

  }


  // Disable ESP32 button
  const sendButton =
    document.getElementById("sendLedButton");


  if (sendButton) {

    sendButton.disabled = true;

  }


  // Disable Save button
  const saveButton =
    document.getElementById("saveButton");


  if (saveButton) {

    saveButton.disabled = true;

  }


  // Reset variables
  imageData = null;

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  // Remove temporary map marker
  if (
    typeof currentMarker !== "undefined" &&
    currentMarker &&
    map
  ) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }

}


// ============================================================
// MESSAGE / NOTIFICATION
// ============================================================

function showMessage(message, type = "normal") {

  let messageBox =
    document.getElementById("messageBox");


  // Create message box if it doesn't exist
  if (!messageBox) {

    messageBox =
      document.createElement("div");

    messageBox.id =
      "messageBox";


    messageBox.style.position =
      "fixed";

    messageBox.style.bottom =
      "20px";

    messageBox.style.right =
      "20px";

    messageBox.style.zIndex =
      "9999";

    messageBox.style.padding =
      "14px 18px";

    messageBox.style.borderRadius =
      "12px";

    messageBox.style.fontWeight =
      "600";

    messageBox.style.maxWidth =
      "350px";

    messageBox.style.boxShadow =
      "0 10px 30px rgba(0,0,0,0.15)";


    document.body.appendChild(
      messageBox
    );

  }


  messageBox.textContent =
    message;


  if (type === "error") {

    messageBox.style.background =
      "#fee2e2";

    messageBox.style.color =
      "#991b1b";

  } else {

    messageBox.style.background =
      "#dcfce7";

    messageBox.style.color =
      "#166534";

  }


  messageBox.style.display =
    "block";


  clearTimeout(
    window.mosquiScanMessageTimer
  );


  window.mosquiScanMessageTimer =
    setTimeout(
      function() {

        messageBox.style.display =
          "none";

      },
      4000
    );

}


// ============================================================
// OPTIONAL: CLEAR ALL RECORDS
// ============================================================

function clearAllRecords() {

  const confirmation =
    confirm(
      "Are you sure you want to delete all inspection records?"
    );


  if (!confirmation) return;


  records = [];


  localStorage.removeItem(
    "mosquiscanRecords"
  );


  updateDashboard();

  displaySavedRecords();


  showMessage(
    "All inspection records have been cleared.",
    "normal"
  );

}
