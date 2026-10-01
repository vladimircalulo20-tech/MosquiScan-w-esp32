/* =========================================================
   MOSQUISCAN MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */


/*
  IMPORTANT:
  Replace the empty string with the REAL IP address
  printed by your ESP32 Serial Monitor.

  Example:

  const ESP32_IP = "192.168.1.45";

  Do NOT use the example unless it is actually your ESP32 IP.
*/

const ESP32_IP = "192.168.100.193";


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


/* Saved records */

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
   LOAD AI MODEL
========================================================= */

async function loadAIModel() {

  try {

    showMessage(
      "Loading AI model...",
      "normal"
    );


    model =
      await tmImage.load(
        MODEL_URL +
        "model.json",

        MODEL_URL +
        "metadata.json"
      );


    showMessage(
      "AI model loaded successfully.",
      "success"
    );


    console.log(
      "MosquiScan AI model loaded."
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


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    showMessage(
      "Please select an image file.",
      "error"
    );

    return;

  }


  const reader =
    new FileReader();


  reader.onload =
    function () {

      imageData =
        reader.result;


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
        .classList
        .remove("hidden");


      currentAIResult = null;

      currentConfidence = null;

      currentReason = null;


      document
        .getElementById(
          "aiResult"
        )
        .textContent =
        "Ready for analysis";


      document
        .getElementById(
          "confidence"
        )
        .textContent =
        "—";


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
        "Click “Analyze Image” to classify this inspection image.";


      document
        .getElementById(
          "resultIcon"
        )
        .textContent =
        "AI";


      document
        .getElementById(
          "classifyButton"
        )
        .disabled =
        false;


      document
        .getElementById(
          "sendLedButton"
        )
        .disabled =
        true;


      document
        .getElementById(
          "saveButton"
        )
        .disabled =
        true;


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
    .getElementById(
      "imageInput"
    )
    .value =
    "";


  document
    .getElementById(
      "imagePreview"
    )
    .src =
    "";


  document
    .getElementById(
      "previewArea"
    )
    .classList
    .add("hidden");


  imageData = null;

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
    "—";


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
    "Analyze an image to generate an explanation.";


  document
    .getElementById(
      "resultIcon"
    )
    .textContent =
    "AI";


  document
    .getElementById(
      "classifyButton"
    )
    .disabled =
    true;


  document
    .getElementById(
      "sendLedButton"
    )
    .disabled =
    true;


  document
    .getElementById(
      "saveButton"
    )
    .disabled =
    true;

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


  classifyButton.disabled =
    true;


  classifyButton.textContent =
    "🤖 Analyzing...";


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


    const topPrediction =
      predictions[0];


    const className =
      topPrediction.className;


    const probability =
      topPrediction.probability;


    currentConfidence =
      probability;


    /* Normalize AI class */

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


    /* Reason */

    currentReason =
      generateReason(
        currentAIResult
      );


    /* Display */

    document
      .getElementById(
        "aiResult"
      )
      .textContent =
      currentAIResult;


    document
      .getElementById(
        "confidence"
      )
      .textContent =
      formatConfidence(
        probability
      );


    document
      .getElementById(
        "confidenceFill"
      )
      .style.width =
      (
        probability * 100
      ).toFixed(1) +
      "%";


    document
      .getElementById(
        "reason"
      )
      .textContent =
      currentReason;


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

      resultIcon.style.color =
        "#dc2626";

      resultIcon.style.background =
        "#fee2e2";

    }

    else if (
      currentAIResult ===
      "Not a Possible Breeding Site"
    ) {

      resultIcon.textContent =
        "●";

      resultIcon.style.color =
        "#16a34a";

      resultIcon.style.background =
        "#dcfce7";

    }

    else {

      resultIcon.textContent =
        "AI";

    }


    document
      .getElementById(
        "sendLedButton"
      )
      .disabled =
      false;


    document
      .getElementById(
        "saveButton"
      )
      .disabled =
      false;


    showMessage(
      "AI classification complete.",
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
    "🤖 Analyze Image";

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
    "The AI classification does not match the expected "
    +
    "MosquiScan categories."
  );

}


/* =========================================================
   FORMAT CONFIDENCE
========================================================= */

function formatConfidence(value) {

  return (
    (value * 100).toFixed(1)
    +
    "%"
  );

}


/* =========================================================
   ESP32
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
   ESP STATUS
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
      "Configured",
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


  status.lastChild.textContent =
    " " + text;


  if (
    type ===
    "connected"
  ) {

    dot.style.background =
      "#22c55e";

    dot.style.boxShadow =
      "0 0 10px #22c55e";

  }


  else if (
    type ===
    "error"
  ) {

    dot.style.background =
      "#ef4444";

    dot.style.boxShadow =
      "0 0 10px #ef4444";

  }


  else {

    dot.style.background =
      "#94a3b8";

    dot.style.boxShadow =
      "none";

  }

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
      .value;


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
   CLEAR FORM
========================================================= */

function clearInspectionForm() {


  document
    .getElementById(
      "imageInput"
    )
    .value =
    "";


  document
    .getElementById(
      "imagePreview"
    )
    .src =
    "";


  document
    .getElementById(
      "previewArea"
    )
    .classList
    .add("hidden");


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
    "—";


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
    "Analyze an image to generate an explanation.";


  document
    .getElementById(
      "resultIcon"
    )
    .textContent =
    "AI";


  document
    .getElementById(
      "classifyButton"
    )
    .disabled =
    true;


  document
    .getElementById(
      "sendLedButton"
    )
    .disabled =
    true;


  document
    .getElementById(
      "saveButton"
    )
    .disabled =
    true;


  imageData = null;

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;

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
   MAP
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
        "&copy; OpenStreetMap contributors"

    }

  ).addTo(map);


  records.forEach(
    addRecordMarker
  );

}


/* =========================================================
   CREATE MARKER ICON
========================================================= */

function createMarkerIcon(
  type
) {


  return L.divIcon({

    className: "",

    html:
      `<div class="custom-marker ${type}"></div>`,

    iconSize:
      [18,18],

    iconAnchor:
      [9,9],

    popupAnchor:
      [0,-9]

  });

}


/* =========================================================
   ADD RECORD MARKER
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


  const type =
    record.result ===
    "Possible Breeding Site"

      ? "possible"

      : "not-possible";


  const marker =
    L.marker(
      [lat,lng],
      {
        icon:
          createMarkerIcon(
            type
          )
      }
    )
    .addTo(map);


  const imageHTML =
    record.image

      ? `
        <img
          src="${record.image}"
          style="
            width:180px;
            max-height:120px;
            object-fit:cover;
            border-radius:8px;
            margin-top:8px;
          "
        >
      `

      : "";


  marker.bindPopup(`

    <strong>
      ${escapeHTML(record.result)}
    </strong>

    <br>

    Confidence:
    ${formatConfidence(record.confidence)}

    <br>

    ${escapeHTML(record.date)}

    <br><br>

    ${escapeHTML(record.reason)}

    ${imageHTML}

  `);

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
        "Current location added.",
        "success"
      );

    },


    error => {

      console.error(
        error
      );


      showMessage(
        "Could not get your location. You can enter the coordinates manually.",
        "error"
      );

    },

    {
      enableHighAccuracy:
        true,

      timeout:
        10000,

      maximumAge:
        0

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


  map.setView(
    [lat,lng],
    16
  );


  if (
    currentMarker
  ) {

    map.removeLayer(
      currentMarker
    );

  }


  currentMarker =
    L.marker(
      [lat,lng],
      {
        draggable:
          true
      }
    )
    .addTo(map);


  currentMarker
    .bindPopup(
      "<strong>Inspection Location</strong><br>Drag this marker to adjust the location."
    )
    .openPopup();


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

}


/* =========================================================
   MANUAL COORDINATES
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
   CLEAR LOCATION
========================================================= */

function clearLocation() {


  document
    .getElementById(
      "latitude"
    )
    .value =
    "";


  document
    .getElementById(
      "longitude"
    )
    .value =
    "";


  if (
    currentMarker
  ) {

    map.removeLayer(
      currentMarker
    );

    currentMarker =
      null;

  }

}


/* =========================================================
   RENDER RECORDS
========================================================= */

function renderRecords() {


  const container =
    document.getElementById(
      "recordsContainer"
    );


  if (
    !records.length
  ) {

    container.innerHTML = `

      <div class="empty-records">

        <div class="empty-icon">
          ◫
        </div>

        <h3>
          No inspection records yet
        </h3>

        <p>
          Saved inspections will appear here.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    records.map(
      record => `

        <div
          class="record-item"
          style="
            display:grid;
            grid-template-columns:120px 1fr auto;
            gap:18px;
            align-items:center;
            padding:16px;
            border:1px solid #dbe7df;
            border-radius:14px;
            background:#fff;
          "
        >

          <img
            src="${record.image}"
            alt="Inspection"
            style="
              width:120px;
              height:90px;
              object-fit:cover;
              border-radius:10px;
              background:#f1f5f9;
            "
          >

          <div>

            <strong
              style="
                font-size:.8rem;
                color:${
                  record.result ===
                  "Possible Breeding Site"
                    ? "#dc2626"
                    : "#16a34a"
                };
              "
            >

              ${escapeHTML(
                record.result
              )}

            </strong>


            <div
              style="
                margin-top:5px;
                font-size:.65rem;
                color:#64748b;
              "
            >

              Confidence:
              ${formatConfidence(
                record.confidence
              )}

            </div>


            <div
              style="
                margin-top:4px;
                font-size:.62rem;
                color:#64748b;
              "
            >

              ${escapeHTML(
                record.date
              )}

            </div>


            <p
              style="
                margin-top:8px;
                font-size:.68rem;
                color:#475569;
                line-height:1.5;
              "
            >

              ${escapeHTML(
                record.reason
              )}

            </p>

          </div>


          <button
            onclick="deleteRecord(${record.id})"
            style="
              border:none;
              background:#fee2e2;
              color:#991b1b;
              padding:8px 10px;
              border-radius:8px;
              font-size:.62rem;
              font-weight:800;
              cursor:pointer;
            "
          >

            Delete

          </button>

        </div>

      `
    )
    .join("");

}


/* =========================================================
   DELETE RECORD
========================================================= */

function deleteRecord(
  id
) {


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


  if (
    !records.length
  ) {

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


  currentMarker =
    null;


  updateDashboard();

  renderRecords();


  showMessage(
    "All inspection records have been deleted.",
    "success"
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
    addRecordMarker
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
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
