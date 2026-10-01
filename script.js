/* =========================================================
   MOSQUISCAN
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   ESP32 CONFIGURATION
   ========================================================= */

/*
   IMPORTANT:

   Put the IP address shown in the ESP32 Serial Monitor here.

   Example:

   const ESP32_IP = "192.168.1.45";

   Do NOT include:
   http://
   /possible
   /not-possible
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


/* =========================================================
   SAVED RECORDS
   ========================================================= */

let records =
  JSON.parse(
    localStorage.getItem(
      "mosquiscanRecords"
    )
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

  const removeImageButton =
    document.getElementById(
      "removeImageButton"
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


  removeImageButton.addEventListener(
    "click",
    clearInspectionForm
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
   LOAD AI MODEL
   ========================================================= */

async function loadAIModel() {

  try {

    showMessage(
      "Loading AI model...",
      "normal"
    );

    const modelURL =
      MODEL_URL +
      "model.json";

    const metadataURL =
      MODEL_URL +
      "metadata.json";


    model =
      await tmImage.load(
        modelURL,
        metadataURL
      );


    showMessage(
      "AI model loaded successfully.",
      "success"
    );


    console.log(
      "MosquiScan AI model loaded."
    );

  }

  catch (error) {

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


  const reader =
    new FileReader();


  reader.onload = function (e) {

    imageData =
      e.target.result;


    const imagePreview =
      document.getElementById(
        "imagePreview"
      );


    imagePreview.src =
      imageData;


    document
      .getElementById(
        "previewArea"
      )
      .classList
      .add("active");


    document
      .getElementById(
        "classifyButton"
      )
      .disabled = false;


    resetAIResult();


    showMessage(
      "Image ready for analysis.",
      "success"
    );

  };


  reader.readAsDataURL(file);

}


/* =========================================================
   CLASSIFY IMAGE
   ========================================================= */

async function classifyImage() {

  if (!imageData) {

    showMessage(
      "Please select an image first.",
      "error"
    );

    return;
  }


  if (!model) {

    showMessage(
      "AI model is still loading.",
      "error"
    );

    return;
  }


  try {

    const image =
      document.getElementById(
        "imagePreview"
      );


    const predictions =
      await model.predict(
        image
      );


    let bestPrediction =
      predictions[0];


    for (
      let i = 1;
      i < predictions.length;
      i++
    ) {

      if (
        predictions[i]
          .probability >
        bestPrediction.probability
      ) {

        bestPrediction =
          predictions[i];

      }

    }


    const className =
      bestPrediction.className;


    const probability =
      bestPrediction.probability;


    const normalized =
      className
        .toLowerCase()
        .trim();


    /* ================================================
       NORMALIZE AI CLASS
       ================================================ */

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


    currentConfidence =
      probability * 100;


    currentReason =
      getClassificationReason(
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

}


/* =========================================================
   CLASSIFICATION REASON
   ========================================================= */

function getClassificationReason(
  result
) {

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
    "The AI classified the image based on the categories " +
    "included in the trained model."
  );

}


/* =========================================================
   DISPLAY AI RESULT
   ========================================================= */

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

  const resultIcon =
    document.getElementById(
      "resultIcon"
    );


  resultElement.textContent =
    currentAIResult;


  confidenceElement.textContent =
    currentConfidence.toFixed(2) +
    "%";


  confidenceFill.style.width =
    currentConfidence + "%";


  reasonElement.textContent =
    currentReason;


  if (
    currentAIResult ===
    "Possible Breeding Site"
  ) {

    resultIcon.textContent =
      "🔴";

  }

  else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    resultIcon.textContent =
      "🟢";

  }

  else {

    resultIcon.textContent =
      "🤖";

  }

}


/* =========================================================
   RESET AI RESULT
   ========================================================= */

function resetAIResult() {

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  document
    .getElementById(
      "aiResult"
    )
    .textContent =
    "Waiting for image...";


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
    "Analyze an image to see the AI result and explanation.";


  document
    .getElementById(
      "resultIcon"
    )
    .textContent =
    "🤖";


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
   ESP32 STATUS
   ========================================================= */

function setESPStatus(
  status,
  type
) {

  const statusElement =
    document.getElementById(
      "espStatus"
    );

  const dot =
    document.getElementById(
      "espDot"
    );


  statusElement.textContent =
    status;


  dot.className =
    "esp-status-dot";


  if (
    type ===
    "connected"
  ) {

    dot.classList.add(
      "connected"
    );

  }

  else if (
    type ===
    "error"
  ) {

    dot.classList.add(
      "error"
    );

  }

}


/* =========================================================
   SAVE INSPECTION
   ========================================================= */

function saveInspection() {

  if (!currentAIResult) {

    showMessage(
      "Analyze an image first.",
      "error"
    );

    return;

  }


  if (!imageData) {

    showMessage(
      "Please select an image.",
      "error"
    );

    return;

  }


  const latitude =
    document
      .getElementById(
        "latitude"
      )
      .value
      .trim();


  const longitude =
    document
      .getElementById(
        "longitude"
      )
      .value
      .trim();


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
      new Date()
        .toLocaleString()

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


  if (
    latitude &&
    longitude
  ) {

    addRecordMarker(
      record
    );

  }


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
    .getElementById(
      "imageInput"
    )
    .value = "";


  document
    .getElementById(
      "previewArea"
    )
    .classList
    .remove("active");


  document
    .getElementById(
      "imagePreview"
    )
    .removeAttribute("src");


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


  document
    .getElementById(
      "classifyButton"
    )
    .disabled = true;


  imageData = null;


  if (
    currentMarker
  ) {

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
        No inspection records yet.
      </div>
    `;

    return;

  }


  container.innerHTML =
    records
      .map(
        record =>
          createRecordHTML(
            record
          )
      )
      .join("");


  document
    .querySelectorAll(
      ".delete-record-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteRecord(
              Number(
                button.dataset.id
              )
            );

          }
        );

      }
    );

}


/* =========================================================
   CREATE RECORD HTML
   ========================================================= */

function createRecordHTML(
  record
) {

  const isPossible =
    record.result ===
    "Possible Breeding Site";


  const resultClass =
    isPossible
      ? "possible"
      : "not-possible";


  const coordinates =
    record.latitude &&
    record.longitude

      ? `${record.latitude}, ${record.longitude}`

      : "No location";


  return `

    <div class="record-card">

      <img
        src="${record.image}"
        alt="Inspection image"
        class="record-image"
      >

      <div class="record-info">

        <div
          class="record-result ${resultClass}"
        >
          ${escapeHTML(record.result)}
        </div>

        <div class="record-meta">

          Confidence:
          ${Number(record.confidence).toFixed(2)}%

          <br>

          Location:
          ${escapeHTML(coordinates)}

          <br>

          Date:
          ${escapeHTML(record.date)}

        </div>

        <div class="record-reason">

          <strong>
            Reason:
          </strong>

          ${escapeHTML(record.reason)}

        </div>

        ${
          record.notes
            ? `
              <div class="record-reason">
                <strong>
                  Notes:
                </strong>
                ${escapeHTML(record.notes)}
              </div>
            `
            : ""
        }

      </div>


      <div class="record-actions">

        <button
          type="button"
          class="delete-record-button"
          data-id="${record.id}"
        >
          🗑️ Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   DELETE ONE RECORD
   ========================================================= */

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
   MAP SETUP
   ========================================================= */

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
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);


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


/* =========================================================
   SET MAP LOCATION
   ========================================================= */

function setMapLocation(
  lat,
  lng
) {

  if (
    currentMarker
  ) {

    map.removeLayer(
      currentMarker
    );

  }


  currentMarker =
    L.marker(
      [
        lat,
        lng
      ],
      {
        draggable: true
      }
    )
    .addTo(map);


  currentMarker.bindPopup(
    `
      <strong>
        Inspection Location
      </strong>
      <br>
      Drag this marker to adjust the location.
    `
  );


  currentMarker.openPopup();


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
    [
      lat,
      lng
    ],
    16
  );

}


/* =========================================================
   GET CURRENT LOCATION
   ========================================================= */

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

    function (position) {

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
        "Current location added.",
        "success"
      );

    },


    function (error) {

      console.error(
        "Location error:",
        error
      );


      showMessage(
        "Could not get your location. Please allow location access or enter the coordinates manually.",
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
    .getElementById(
      "latitude"
    )
    .value = "";


  document
    .getElementById(
      "longitude"
    )
    .value = "";


  if (
    currentMarker
  ) {

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


/* =========================================================
   UPDATE MAP FROM MANUAL COORDINATES
   ========================================================= */

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


/* =========================================================
   ADD SAVED RECORD MARKER
   ========================================================= */

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
      [
        lat,
        lng
      ],
      {
        icon:
          createMarkerIcon(
            markerType
          )
      }
    )
    .addTo(map);


  const image =
    record.image
      ? `
        <img
          src="${record.image}"
          style="
            width:160px;
            height:100px;
            object-fit:cover;
            border-radius:8px;
            margin-top:8px;
          "
          alt="Inspection image"
        >
      `
      : "";


  marker.bindPopup(
    `
      <div style="min-width:190px;">

        <strong>
          ${escapeHTML(record.result)}
        </strong>

        <br>

        Confidence:
        ${Number(record.confidence).toFixed(2)}%

        <br>

        Date:
        ${escapeHTML(record.date)}

        <br><br>

        <strong>
          Reason:
        </strong>

        <br>

        ${escapeHTML(record.reason)}

        ${
          record.notes
            ? `
              <br><br>

              <strong>
                Notes:
              </strong>

              <br>

              ${escapeHTML(record.notes)}
            `
            : ""
        }

        ${image}

      </div>
    `
  );

}


/* =========================================================
   CREATE MAP ICON
   ========================================================= */

function createMarkerIcon(
  type
) {

  return L.divIcon({

    className: "",

    html:
      `
        <div
          class="custom-marker ${type}"
        ></div>
      `,

    iconSize:
      [18, 18],

    iconAnchor:
      [9, 9],

    popupAnchor:
      [0, -10]

  });

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


/* =========================================================
   ESCAPE HTML
   ========================================================= */

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


/* =========================================================
   MESSAGE
   ========================================================= */

let messageTimeout = null;


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
    "message-box show";


  if (
    type === "success"
  ) {

    box.classList.add(
      "success"
    );

  }

  else if (
    type === "error"
  ) {

    box.classList.add(
      "error"
    );

  }


  clearTimeout(
    messageTimeout
  );


  messageTimeout =
    setTimeout(
      () => {

        box.classList.remove(
          "show"
        );

      },
      3500
    );

}
