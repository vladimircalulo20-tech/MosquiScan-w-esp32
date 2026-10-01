// =====================================================
// MOSQUISCAN
// Smartphone-Based AI System for Detecting
// Potential Mosquito Breeding Sites
// =====================================================


// =====================================================
// ESP32 CONFIGURATION
// =====================================================

// Put your ESP32 IP address here.
// Example:
// const ESP32_IP = "192.168.1.45";

const ESP32_IP = "";


// =====================================================
// TEACHABLE MACHINE MODEL
// =====================================================

const MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let model = null;

let imageData = null;

let currentAIResult = null;

let currentConfidence = null;

let currentReason = null;

let currentMarker = null;

let map = null;

let records =
  JSON.parse(
    localStorage.getItem("mosquiscanRecords")
  ) || [];


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupMap();

    setupEventListeners();

    updateDashboard();

    renderRecords();

    await loadAIModel();

  }
);


// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {

  document
    .getElementById("imageInput")
    .addEventListener(
      "change",
      handleImageUpload
    );


  document
    .getElementById("removeImageButton")
    .addEventListener(
      "click",
      clearImage
    );


  document
    .getElementById("classifyButton")
    .addEventListener(
      "click",
      classifyImage
    );


  document
    .getElementById("sendLedButton")
    .addEventListener(
      "click",
      sendResultToESP32
    );


  document
    .getElementById("saveButton")
    .addEventListener(
      "click",
      saveInspection
    );


  document
    .getElementById("locationButton")
    .addEventListener(
      "click",
      getCurrentLocation
    );


  document
    .getElementById("clearLocationButton")
    .addEventListener(
      "click",
      clearLocation
    );


  document
    .getElementById("clearRecordsButton")
    .addEventListener(
      "click",
      clearAllRecords
    );


  document
    .getElementById("latitude")
    .addEventListener(
      "change",
      updateMapFromCoordinates
    );


  document
    .getElementById("longitude")
    .addEventListener(
      "change",
      updateMapFromCoordinates
    );

}


// =====================================================
// LOAD AI MODEL
// =====================================================

async function loadAIModel() {

  try {

    showMessage(
      "Loading AI model...",
      "normal"
    );


    const modelURL =
      MODEL_URL + "model.json";

    const metadataURL =
      MODEL_URL + "metadata.json";


    model =
      await tmImage.load(
        modelURL,
        metadataURL
      );


    showMessage(
      "AI model loaded successfully.",
      "success"
    );

  } catch (error) {

    console.error(
      "AI model loading error:",
      error
    );

    showMessage(
      "Could not load the AI model.",
      "error"
    );

  }

}


// =====================================================
// IMAGE UPLOAD
// =====================================================

function handleImageUpload(event) {

  const file =
    event.target.files[0];

  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    function (e) {

      imageData =
        e.target.result;


      const preview =
        document.getElementById(
          "imagePreview"
        );


      preview.src =
        imageData;


      document
        .getElementById(
          "previewArea"
        )
        .classList.remove(
          "hidden"
        );


      document
        .querySelector(
          ".upload-label"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "classifyButton"
        )
        .disabled = false;


      resetAIResult();

    };


  reader.readAsDataURL(file);

}


// =====================================================
// CLEAR IMAGE
// =====================================================

function clearImage() {

  document
    .getElementById(
      "imageInput"
    )
    .value = "";


  document
    .getElementById(
      "imagePreview"
    )
    .src = "";


  document
    .getElementById(
      "previewArea"
    )
    .classList.add(
      "hidden"
    );


  document
    .querySelector(
      ".upload-label"
    )
    .classList.remove(
      "hidden"
    );


  imageData = null;


  resetAIResult();

}


// =====================================================
// RESET AI RESULT
// =====================================================

function resetAIResult() {

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  document
    .getElementById(
      "aiResult"
    )
    .textContent =
    "Waiting for image";


  document
    .getElementById(
      "confidence"
    )
    .textContent =
    "0%";


  document
    .getElementById(
      "confidenceFill"
    )
    .style.width =
    "0%";


  document
    .getElementById(
      "reason"
    )
    .textContent =
    "Analyze an image to receive the AI classification and explanation.";


  const icon =
    document.getElementById(
      "resultIcon"
    );


  icon.className =
    "result-icon neutral";


  icon.textContent =
    "?";


  document
    .getElementById(
      "sendLedButton"
    )
    .disabled = true;


  document
    .getElementById(
      "saveButton"
    )
    .disabled = true;

}


// =====================================================
// CLASSIFY IMAGE
// =====================================================

async function classifyImage() {

  if (!model) {

    showMessage(
      "The AI model is still loading.",
      "error"
    );

    return;

  }


  if (!imageData) {

    showMessage(
      "Please upload an image first.",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "classifyButton"
    );


  button.disabled = true;

  button.textContent =
    "Analyzing...";


  try {

    const image =
      document.getElementById(
        "imagePreview"
      );


    const predictions =
      await model.predict(
        image
      );


    predictions.sort(
      (a, b) =>
        b.probability -
        a.probability
    );


    const best =
      predictions[0];


    const className =
      best.className;


    const confidence =
      best.probability;


    const normalized =
      className
        .toLowerCase()
        .trim();


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

      currentAIResult =
        className;

    }


    currentConfidence =
      confidence;


    currentReason =
      getReason(
        currentAIResult
      );


    displayAIResult();


    document
      .getElementById(
        "sendLedButton"
      )
      .disabled = false;


    document
      .getElementById(
        "saveButton"
      )
      .disabled = false;


    showMessage(
      "AI classification completed.",
      "success"
    );


  } catch (error) {

    console.error(
      "Classification error:",
      error
    );


    showMessage(
      "Could not analyze the image.",
      "error"
    );

  }


  button.disabled = false;

  button.textContent =
    "Analyze Image";

}


// =====================================================
// DISPLAY AI RESULT
// =====================================================

function displayAIResult() {

  const resultElement =
    document.getElementById(
      "aiResult"
    );


  const confidenceElement =
    document.getElementById(
      "confidence"
    );


  const confidenceFill =
    document.getElementById(
      "confidenceFill"
    );


  const reasonElement =
    document.getElementById(
      "reason"
    );


  const icon =
    document.getElementById(
      "resultIcon"
    );


  resultElement.textContent =
    currentAIResult;


  const percentage =
    Math.round(
      currentConfidence * 100
    );


  confidenceElement.textContent =
    percentage + "%";


  confidenceFill.style.width =
    percentage + "%";


  reasonElement.textContent =
    currentReason;


  if (
    currentAIResult ===
    "Possible Breeding Site"
  ) {

    icon.className =
      "result-icon possible";

    icon.textContent =
      "!";

  } else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    icon.className =
      "result-icon not-possible";

    icon.textContent =
      "✓";

  } else {

    icon.className =
      "result-icon neutral";

    icon.textContent =
      "?";

  }

}


// =====================================================
// REASON
// =====================================================

function getReason(result) {

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


  return (
    "The AI classification does not match the two " +
    "configured MosquiScan categories."
  );

}


// =====================================================
// ESP32
// =====================================================

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

    endpoint =
      "/possible";

  } else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    endpoint =
      "/not-possible";

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


    const response =
      await fetch(
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
      "ESP32 received: " +
      text,
      "success"
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


// =====================================================
// ESP STATUS
// =====================================================

function setESPStatus(
  text,
  type
) {

  const status =
    document.getElementById(
      "espStatus"
    );


  const dot =
    document.getElementById(
      "espDot"
    );


  status.textContent =
    "ESP32 " + text;


  dot.className =
    "status-dot";


  if (
    type ===
    "connected"
  ) {

    dot.classList.add(
      "connected"
    );

  }


  if (
    type ===
    "error"
  ) {

    dot.classList.add(
      "error"
    );

  }

}


// =====================================================
// SAVE INSPECTION
// =====================================================

function saveInspection() {

  if (!currentAIResult) {

    showMessage(
      "Analyze the image first.",
      "error"
    );

    return;

  }


  if (!imageData) {

    showMessage(
      "Please upload an image.",
      "error"
    );

    return;

  }


  const latitude =
    document
      .getElementById(
        "latitude"
      )
      .value;


  const longitude =
    document
      .getElementById(
        "longitude"
      )
      .value;


  const notes =
    document
      .getElementById(
        "notes"
      )
      .value
      .trim();


  const record = {

    id:
      Date.now(),

    image:
      imageData,

    result:
      currentAIResult,

    confidence:
      currentConfidence,

    reason:
      currentReason,

    latitude:
      latitude,

    longitude:
      longitude,

    notes:
      notes,

    date:
      new Date().toLocaleString()

  };


  records.unshift(
    record
  );


  localStorage.setItem(
    "mosquiscanRecords",
    JSON.stringify(records)
  );


  updateDashboard();

  renderRecords();

  rebuildMap();


  showMessage(
    "Inspection record saved successfully.",
    "success"
  );


  clearInspectionForm();

}


// =====================================================
// CLEAR FORM
// =====================================================

function clearInspectionForm() {

  document
    .getElementById(
      "imageInput"
    )
    .value = "";


  document
    .getElementById(
      "imagePreview"
    )
    .src = "";


  document
    .getElementById(
      "previewArea"
    )
    .classList.add(
      "hidden"
    );


  document
    .querySelector(
      ".upload-label"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "latitude"
    )
    .value = "";


  document
    .getElementById(
      "longitude"
    )
    .value = "";


  document
    .getElementById(
      "notes"
    )
    .value = "";


  resetAIResult();


  imageData = null;


  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }

}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

  const total =
    records.length;


  const possible =
    records.filter(
      record =>
        record.result ===
        "Possible Breeding Site"
    ).length;


  const notPossible =
    records.filter(
      record =>
        record.result ===
        "Not a Possible Breeding Site"
    ).length;


  document
    .getElementById(
      "totalRecords"
    )
    .textContent =
    total;


  document
    .getElementById(
      "possibleSites"
    )
    .textContent =
    possible;


  document
    .getElementById(
      "notPossibleSites"
    )
    .textContent =
    notPossible;

}


// =====================================================
// MAP SETUP
// =====================================================

function setupMap() {

  map =
    L.map(
      "map"
    ).setView(
      [
        9.8190,
        124.4970
      ],
      13
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  rebuildMap();

}


// =====================================================
// REBUILD MAP
// =====================================================

function rebuildMap() {

  if (!map) {
    return;
  }


  map.eachLayer(
    layer => {

      if (
        layer instanceof
        L.Marker
      ) {

        map.removeLayer(
          layer
        );

      }

    }
  );


  records.forEach(
    record => {

      if (
        record.latitude &&
        record.longitude
      ) {

        addRecordMarker(
          record
        );

      }

    }
  );

}


// =====================================================
// CREATE MARKER ICON
// =====================================================

function createMarkerIcon(
  type
) {

  return L.divIcon({

    className: "",

    html:
      `<div class="custom-marker ${type}"></div>`,

    iconSize:
      [18, 18],

    iconAnchor:
      [9, 9]

  });

}


// =====================================================
// TEMPORARY MAP LOCATION
// =====================================================

function setMapLocation(
  lat,
  lng
) {

  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

  }


  currentMarker =
    L.marker(
      [lat, lng],
      {
        draggable: true,

        icon:
          createMarkerIcon(
            "neutral"
          )
      }
    ).addTo(map);


  currentMarker.bindPopup(
    "<strong>Inspection Location</strong><br>" +
    "Drag this marker to adjust the location."
  );


  currentMarker.on(
    "dragend",
    function () {

      const position =
        currentMarker.getLatLng();


      document
        .getElementById(
          "latitude"
        )
        .value =
        position.lat.toFixed(6);


      document
        .getElementById(
          "longitude"
        )
        .value =
        position.lng.toFixed(6);

    }
  );


  map.setView(
    [lat, lng],
    16
  );

}


// =====================================================
// CURRENT LOCATION
// =====================================================

function getCurrentLocation() {

  if (
    !navigator.geolocation
  ) {

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

    position => {

      const lat =
        position.coords.latitude;


      const lng =
        position.coords.longitude;


      document
        .getElementById(
          "latitude"
        )
        .value =
        lat.toFixed(6);


      document
        .getElementById(
          "longitude"
        )
        .value =
        lng.toFixed(6);


      setMapLocation(
        lat,
        lng
      );


      showMessage(
        "Location obtained successfully.",
        "success"
      );

    },


    error => {

      console.error(
        error
      );


      showMessage(
        "Could not get your location. Please allow location access.",
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


// =====================================================
// CLEAR LOCATION
// =====================================================

function clearLocation() {

  document
    .getElementById(
      "latitude"
    )
    .value = "";


  document
    .getElementById(
      "longitude"
    )
    .value = "";


  if (currentMarker) {

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


// =====================================================
// MANUAL COORDINATES
// =====================================================

function updateMapFromCoordinates() {

  const lat =
    parseFloat(
      document
        .getElementById(
          "latitude"
        )
        .value
    );


  const lng =
    parseFloat(
      document
        .getElementById(
          "longitude"
        )
        .value
    );


  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {

    setMapLocation(
      lat,
      lng
    );

  }

}


// =====================================================
// SAVED RECORD MARKER
// =====================================================

function addRecordMarker(
  record
) {

  const lat =
    parseFloat(
      record.latitude
    );


  const lng =
    parseFloat(
      record.longitude
    );


  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {

    return;

  }


  const markerType =
    record.result ===
    "Possible Breeding Site"
      ? "possible"
      : "not-possible";


  const marker =
    L.marker(
      [lat, lng],
      {
        icon:
          createMarkerIcon(
            markerType
          )
      }
    ).addTo(map);


  let popup =
    `<strong>${escapeHTML(record.result)}</strong><br>`;


  popup +=
    `Confidence: ${Math.round(
      record.confidence * 100
    )}%<br>`;


  popup +=
    `Date: ${escapeHTML(record.date)}<br>`;


  popup +=
    `<br><strong>Reason:</strong><br>${escapeHTML(record.reason)}`;


  if (record.notes) {

    popup +=
      `<br><br><strong>Notes:</strong><br>${escapeHTML(record.notes)}`;

  }


  if (record.image) {

    popup +=
      `<br><br>
      <img
        src="${record.image}"
        style="
          width:180px;
          max-height:130px;
          object-fit:cover;
          border-radius:8px;
        "
      >`;

  }


  marker.bindPopup(
    popup
  );

}


// =====================================================
// RECORDS DISPLAY
// =====================================================

function renderRecords() {

  const container =
    document.getElementById(
      "recordsContainer"
    );


  if (!records.length) {

    container.innerHTML =
      `<div class="empty-records">
        No inspection records yet.
      </div>`;

    return;

  }


  container.innerHTML =
    records
      .map(
        record => {

          const resultClass =
            record.result ===
            "Possible Breeding Site"
              ? "possible"
              : "not-possible";


          return `

            <div class="record">

              <img
                class="record-image"
                src="${record.image}"
                alt="Inspection image"
              >

              <div class="record-info">

                <span
                  class="record-result ${resultClass}"
                >
                  ${escapeHTML(record.result)}
                </span>

                <h3>
                  AI Confidence:
                  ${Math.round(
                    record.confidence * 100
                  )}%
                </h3>

                <p>
                  <strong>Date:</strong>
                  ${escapeHTML(record.date)}
                </p>

                <p>
                  <strong>Location:</strong>
                  ${record.latitude || "N/A"},
                  ${record.longitude || "N/A"}
                </p>

                <p>
                  <strong>Reason:</strong>
                  ${escapeHTML(record.reason)}
                </p>

                ${
                  record.notes
                    ? `
                      <p>
                        <strong>Notes:</strong>
                        ${escapeHTML(record.notes)}
                      </p>
                    `
                    : ""
                }

              </div>


              <div class="record-actions">

                <button
                  class="delete-record"
                  type="button"
                  onclick="deleteRecord(${record.id})"
                >
                  Delete
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


// =====================================================
// DELETE ONE RECORD
// =====================================================

function deleteRecord(
  id
) {

  const confirmed =
    confirm(
      "Delete this inspection record?"
    );


  if (!confirmed) {
    return;
  }


  records =
    records.filter(
      record =>
        record.id !== id
    );


  localStorage.setItem(
    "mosquiscanRecords",
    JSON.stringify(records)
  );


  updateDashboard();

  renderRecords();

  rebuildMap();


  showMessage(
    "Inspection record deleted.",
    "success"
  );

}


// =====================================================
// DELETE ALL RECORDS
// =====================================================

function clearAllRecords() {

  if (!records.length) {

    showMessage(
      "There are no records to delete.",
      "normal"
    );

    return;

  }


  const confirmed =
    confirm(
      "Are you sure you want to delete ALL inspection records?\n\nThis cannot be undone."
    );


  if (!confirmed) {
    return;
  }


  records = [];


  localStorage.removeItem(
    "mosquiscanRecords"
  );


  rebuildMap();

  currentMarker = null;

  updateDashboard();

  renderRecords();


  showMessage(
    "All inspection records have been deleted.",
    "success"
  );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================================
// MESSAGE BOX
// =====================================================

let messageTimer = null;


function showMessage(
  message,
  type = "normal"
) {

  const box =
    document.getElementById(
      "messageBox"
    );


  box.textContent =
    message;


  box.className =
    "message-box show " +
    type;


  clearTimeout(
    messageTimer
  );


  messageTimer =
    setTimeout(
      () => {

        box.className =
          "message-box";

      },
      3500
    );

}
