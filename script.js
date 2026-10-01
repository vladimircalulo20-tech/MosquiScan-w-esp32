/* =========================================================
   MOSQUISCAN MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

/*
   IMPORTANT:
   Replace the empty string with the ACTUAL IP address
   printed by the ESP32 Serial Monitor.

   Example:
   const ESP32_IP = "192.168.1.45";

   Do NOT copy the example unless it is actually
   your ESP32's IP address.
*/

const ESP32_IP = "";


/* =========================================================
   TEACHABLE MACHINE MODEL
========================================================= */

const MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let model = null;

let imageData = null;

let currentAIResult = null;

let currentConfidence = null;

let currentReason = null;

let currentMarker = null;

let map = null;


/* Load saved records */

let records =
  JSON.parse(
    localStorage.getItem("mosquiscanRecords")
  ) || [];


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupMap();

    setupEventListeners();

    updateDashboard();

    renderRecords();

    loadAIModel();

    updateESPInitialStatus();

  }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  const imageInput =
    document.getElementById(
      "imageInput"
    );

  const classifyButton =
    document.getElementById(
      "classifyButton"
    );

  const sendLedButton =
    document.getElementById(
      "sendLedButton"
    );

  const saveButton =
    document.getElementById(
      "saveButton"
    );

  const removeImageButton =
    document.getElementById(
      "removeImageButton"
    );

  const locationButton =
    document.getElementById(
      "locationButton"
    );

  const clearLocationButton =
    document.getElementById(
      "clearLocationButton"
    );

  const clearRecordsButton =
    document.getElementById(
      "clearRecordsButton"
    );


  imageInput.addEventListener(
    "change",
    handleImageUpload
  );


  classifyButton.addEventListener(
    "click",
    classifyImage
  );


  sendLedButton.addEventListener(
    "click",
    sendResultToESP32
  );


  saveButton.addEventListener(
    "click",
    saveInspection
  );


  removeImageButton.addEventListener(
    "click",
    clearImage
  );


  locationButton.addEventListener(
    "click",
    getCurrentLocation
  );


  clearLocationButton.addEventListener(
    "click",
    clearLocation
  );


  clearRecordsButton.addEventListener(
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


/* =========================================================
   AI MODEL
========================================================= */

async function loadAIModel() {

  try {

    showMessage(
      "Loading AI model...",
      "normal"
    );

    model =
      await tmImage.load(
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
      );

    console.log(
      "MosquiScan AI model loaded."
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
      "Could not load the AI model. Check the model URL and internet connection.",
      "error"
    );

  }

}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

function handleImageUpload(event) {

  const file =
    event.target.files[0];


  if (!file) {
    return;
  }


  if (!file.type.startsWith("image/")) {

    showMessage(
      "Please select an image file.",
      "error"
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload = function () {

    imageData =
      reader.result;


    document
      .getElementById("imagePreview")
      .src =
      imageData;


    document
      .getElementById("previewArea")
      .classList
      .remove("hidden");


    resetAIResult();


    document
      .getElementById("classifyButton")
      .disabled = false;


    showMessage(
      "Image ready for analysis.",
      "success"
    );

  };


  reader.readAsDataURL(file);

}


/* =========================================================
   CLEAR IMAGE
========================================================= */

function clearImage() {

  document
    .getElementById("imageInput")
    .value = "";


  document
    .getElementById("imagePreview")
    .src = "";


  document
    .getElementById("previewArea")
    .classList
    .add("hidden");


  resetAIResult();

  imageData = null;

}


/* =========================================================
   RESET AI RESULT
========================================================= */

function resetAIResult() {

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  document
    .getElementById("aiResult")
    .textContent =
    "Ready for analysis";


  document
    .getElementById("confidence")
    .textContent =
    "—";


  document
    .getElementById("reason")
    .textContent =
    "Click “Analyze Image” to classify this inspection image.";


  document
    .getElementById("resultIcon")
    .textContent =
    "AI";


  document
    .getElementById("confidenceFill")
    .style.width =
    "0%";


  document
    .getElementById("sendLedButton")
    .disabled = true;


  document
    .getElementById("saveButton")
    .disabled = true;


  document
    .getElementById("classifyButton")
    .disabled =
    !imageData;

}


/* =========================================================
   AI CLASSIFICATION
========================================================= */

async function classifyImage() {

  if (!model) {

    showMessage(
      "The AI model is still loading. Please wait.",
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


  const classifyButton =
    document.getElementById(
      "classifyButton"
    );


  classifyButton.disabled = true;

  classifyButton.textContent =
    "◈ Analyzing...";


  try {

    const image =
      document.getElementById(
        "imagePreview"
      );


    const predictions =
      await model.predict(image);


    predictions.sort(
      (a, b) =>
        b.probability -
        a.probability
    );


    const topPrediction =
      predictions[0];


    const className =
      topPrediction.className;


    const probability =
      topPrediction.probability;


    currentConfidence =
      probability;


    /*
      Normalize the model class name.
    */

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

    }

    else if (
      normalized.includes("possible")
    ) {

      currentAIResult =
        "Possible Breeding Site";

    }

    else {

      currentAIResult =
        className;

    }


    /*
      Generate explanation.
    */

    currentReason =
      generateReason(
        currentAIResult
      );


    /*
      Display result.
    */

    document
      .getElementById("aiResult")
      .textContent =
      currentAIResult;


    document
      .getElementById("confidence")
      .textContent =
      formatConfidence(
        probability
      );


    document
      .getElementById("confidenceFill")
      .style.width =
      (
        probability * 100
      ).toFixed(1) + "%";


    document
      .getElementById("reason")
      .textContent =
      currentReason;


    /*
      Change result icon.
    */

    const resultIcon =
      document.getElementById(
        "resultIcon"
      );


    if (
      currentAIResult ===
      "Possible Breeding Site"
    ) {

      resultIcon.textContent =
        "●";

      resultIcon.style.background =
        "#fee2e2";

      resultIcon.style.color =
        "#b91c1c";

    }

    else if (
      currentAIResult ===
      "Not a Possible Breeding Site"
    ) {

      resultIcon.textContent =
        "●";

      resultIcon.style.background =
        "#dcfce7";

      resultIcon.style.color =
        "#15803d";

    }

    else {

      resultIcon.textContent =
        "AI";

    }


    document
      .getElementById("sendLedButton")
      .disabled = false;


    document
      .getElementById("saveButton")
      .disabled = false;


    showMessage(
      "AI classification completed.",
      "success"
    );


    console.log(
      "Predictions:",
      predictions
    );

  }

  catch (error) {

    console.error(
      "Classification error:",
      error
    );

    showMessage(
      "Could not analyze the image.",
      "error"
    );

  }


  classifyButton.disabled =
    false;

  classifyButton.textContent =
    "◈ Analyze Image";

}


/* =========================================================
   REASON GENERATOR
========================================================= */

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


  return (
    "The AI produced a classification that is not " +
    "recognized by the current MosquiScan system."
  );

}


/* =========================================================
   FORMAT CONFIDENCE
========================================================= */

function formatConfidence(value) {

  return (
    (value * 100).toFixed(1)
    + "%"
  );

}


/* =========================================================
   ESP32 STATUS
========================================================= */

function updateESPInitialStatus() {

  if (!ESP32_IP) {

    setESPStatus(
      "Not Configured",
      "error"
    );

  }

  else {

    setESPStatus(
      "Ready",
      "normal"
    );

  }

}


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


  dot.classList.remove(
    "connected",
    "error"
  );


  if (type === "connected") {

    dot.classList.add(
      "connected"
    );

  }


  if (type === "error") {

    dot.classList.add(
      "error"
    );

  }

}


/* =========================================================
   SEND RESULT TO ESP32
========================================================= */

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

  }

  else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    endpoint =
      "/not-possible";

  }

  else {

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

  }

  catch (error) {

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


/* =========================================================
   MAP SETUP
========================================================= */

function setupMap() {

  map =
    L.map("map").setView(
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


  records.forEach(
    record => {
      addRecordMarker(record);
    }
  );

}


/* =========================================================
   MAP LOCATION
========================================================= */

function setMapLocation(
  lat,
  lng
) {

  if (!map) {
    return;
  }


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
        .getElementById("latitude")
        .value =
        position.lat.toFixed(6);


      document
        .getElementById("longitude")
        .value =
        position.lng.toFixed(6);

    }
  );


  map.setView(
    [lat, lng],
    16
  );

}


/* =========================================================
   CURRENT LOCATION
========================================================= */

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

    function (position) {

      const lat =
        position.coords.latitude;


      const lng =
        position.coords.longitude;


      document
        .getElementById("latitude")
        .value =
        lat.toFixed(6);


      document
        .getElementById("longitude")
        .value =
        lng.toFixed(6);


      setMapLocation(
        lat,
        lng
      );


      showMessage(
        "Current location added.",
        "success"
      );

    },


    function (error) {

      console.error(
        "Geolocation error:",
        error
      );


      showMessage(
        "Could not get your location. You can enter the coordinates manually.",
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


/* =========================================================
   CLEAR LOCATION
========================================================= */

function clearLocation() {

  document
    .getElementById("latitude")
    .value = "";


  document
    .getElementById("longitude")
    .value = "";


  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }


  showMessage(
    "Inspection location cleared.",
    "normal"
  );

}


/* =========================================================
   MANUAL COORDINATES
========================================================= */

function updateMapFromCoordinates() {

  const lat =
    parseFloat(
      document.getElementById(
        "latitude"
      ).value
    );


  const lng =
    parseFloat(
      document.getElementById(
        "longitude"
      ).value
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


/* =========================================================
   MARKER ICON
========================================================= */

function createMarkerIcon(
  type
) {

  return L.divIcon({

    className: "",

    html:
      '<div class="custom-marker ' +
      type +
      '"></div>',

    iconSize:
      [18, 18],

    iconAnchor:
      [9, 9]

  });

}


/* =========================================================
   ADD RECORD MARKER
========================================================= */

function addRecordMarker(record) {

  if (
    !record.latitude ||
    !record.longitude
  ) {

    return;

  }


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


  const type =
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
            type
          )
      }
    ).addTo(map);


  let popup =

    "<strong>" +
    escapeHTML(
      record.result
    ) +
    "</strong><br><br>" +

    "<b>Confidence:</b> " +
    escapeHTML(
      formatConfidence(
        record.confidence
      )
    ) +
    "<br>" +

    "<b>Date:</b> " +
    escapeHTML(
      record.date
    ) +
    "<br><br>" +

    "<b>Reason:</b><br>" +
    escapeHTML(
      record.reason
    );


  if (record.notes) {

    popup +=
      "<br><br><b>Notes:</b><br>" +
      escapeHTML(
        record.notes
      );

  }


  if (record.image) {

    popup +=
      '<br><br><img src="' +
      record.image +
      '" style="width:180px;max-height:130px;object-fit:cover;border-radius:8px;">';

  }


  marker.bindPopup(
    popup
  );

}


/* =========================================================
   REBUILD MAP
========================================================= */

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

      addRecordMarker(
        record
      );

    }
  );

}


/* =========================================================
   SAVE INSPECTION
========================================================= */

function saveInspection() {

  if (!imageData) {

    showMessage(
      "Please upload an image.",
      "error"
    );

    return;

  }


  if (!currentAIResult) {

    showMessage(
      "Analyze the image first.",
      "error"
    );

    return;

  }


  const latitude =
    document
      .getElementById("latitude")
      .value;


  const longitude =
    document
      .getElementById("longitude")
      .value;


  const notes =
    document
      .getElementById("notes")
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
    JSON.stringify(
      records
    )
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


/* =========================================================
   CLEAR INSPECTION FORM
========================================================= */

function clearInspectionForm() {

  document
    .getElementById("imageInput")
    .value = "";


  document
    .getElementById("imagePreview")
    .src = "";


  document
    .getElementById("previewArea")
    .classList
    .add("hidden");


  document
    .getElementById("latitude")
    .value = "";


  document
    .getElementById("longitude")
    .value = "";


  document
    .getElementById("notes")
    .value = "";


  resetAIResult();


  imageData = null;


  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

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
    .getElementById("totalRecords")
    .textContent =
    total;


  document
    .getElementById("possibleSites")
    .textContent =
    possible;


  document
    .getElementById("notPossibleSites")
    .textContent =
    notPossible;

}


/* =========================================================
   RENDER RECORDS
========================================================= */

function renderRecords() {

  const container =
    document.getElementById(
      "recordsContainer"
    );


  if (!records.length) {

    container.innerHTML = `

      <div class="empty-records">

        <div class="empty-icon">
          ◎
        </div>

        <strong>
          No inspection records yet
        </strong>

        <p>
          Analyze an image and save your first inspection.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    records
      .map(
        record => {

          const possible =
            record.result ===
            "Possible Breeding Site";


          const resultClass =
            possible
              ? "possible"
              : "not-possible";


          return `

            <div class="record-card">

              <img
                class="record-image"
                src="${record.image}"
                alt="Inspection image"
              >

              <div class="record-details">

                <span class="record-result ${resultClass}">
                  ${escapeHTML(record.result)}
                </span>

                <h3>
                  Inspection Record
                </h3>

                <div class="record-meta">

                  <span>
                    ${escapeHTML(record.date)}
                  </span>

                  ${
                    record.latitude &&
                    record.longitude
                      ? `
                        <span>
                          ${escapeHTML(record.latitude)},
                          ${escapeHTML(record.longitude)}
                        </span>
                      `
                      : `
                        <span>
                          No location
                        </span>
                      `
                  }

                  <span>
                    ${formatConfidence(record.confidence)}
                  </span>

                </div>

                <p class="record-reason">
                  <strong>Reason:</strong>
                  ${escapeHTML(record.reason)}
                </p>

                ${
                  record.notes
                    ? `
                      <p class="record-notes">
                        <strong>Notes:</strong>
                        ${escapeHTML(record.notes)}
                      </p>
                    `
                    : ""
                }

              </div>


              <button
                type="button"
                class="delete-record-button"
                onclick="deleteRecord(${record.id})"
              >
                Delete
              </button>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   DELETE ONE RECORD
========================================================= */

function deleteRecord(id) {

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
    JSON.stringify(
      records
    )
  );


  rebuildMap();

  updateDashboard();

  renderRecords();


  showMessage(
    "Inspection record deleted.",
    "success"
  );

}


/* =========================================================
   CLEAR ALL RECORDS
========================================================= */

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


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   MESSAGE
========================================================= */

let messageTimer = null;


function showMessage(
  message,
  type = "normal"
) {

  const box =
    document.getElementById(
      "messageBox"
    );


  const text =
    document.getElementById(
      "messageText"
    );


  text.textContent =
    message;


  box.classList.remove(
    "success",
    "error",
    "show"
  );


  if (
    type === "success"
  ) {

    box.classList.add(
      "success"
    );

  }


  if (
    type === "error"
  ) {

    box.classList.add(
      "error"
    );

  }


  void box.offsetWidth;


  box.classList.add(
    "show"
  );


  clearTimeout(
    messageTimer
  );


  messageTimer =
    setTimeout(
      () => {

        box.classList.remove(
          "show"
        );

      },
      3500
    );

}
