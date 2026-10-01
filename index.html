/* =========================================
   MOSQUISCAN
   MAIN JAVASCRIPT
========================================= */


/* =========================================
   CONFIGURATION
========================================= */

/*
  IMPORTANT:
  Replace the empty string with the actual
  IP address of your ESP32.

  Example:

  const ESP32_IP = "192.168.1.45";

  Do NOT copy the example unless that is
  actually your ESP32 IP address.
*/

const ESP32_IP = "";


/*
  Teachable Machine Model
*/

const MODEL_URL =
  "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";


/* =========================================
   GLOBAL VARIABLES
========================================= */

let model = null;

let imageData = null;

let currentAIResult = null;

let currentConfidence = null;

let currentReason = null;

let currentMarker = null;

let map = null;


/*
  Load saved records from browser storage.
*/

let records =
  JSON.parse(
    localStorage.getItem("mosquiscanRecords")
  ) || [];


/* =========================================
   PAGE INITIALIZATION
========================================= */

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


/* =========================================
   EVENT LISTENERS
========================================= */

function setupEventListeners() {

  const imageInput =
    document.getElementById("imageInput");

  const classifyButton =
    document.getElementById("classifyButton");

  const sendLedButton =
    document.getElementById("sendLedButton");

  const saveButton =
    document.getElementById("saveButton");

  const removeImageButton =
    document.getElementById("removeImageButton");

  const locationButton =
    document.getElementById("locationButton");

  const clearLocationButton =
    document.getElementById(
      "clearLocationButton"
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


  /*
    Manual coordinate changes.
  */

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


/* =========================================
   AI MODEL
========================================= */

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


/* =========================================
   IMAGE UPLOAD
========================================= */

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


  reader.onload = function(e) {

    imageData =
      e.target.result;


    const preview =
      document.getElementById(
        "imagePreview"
      );


    preview.src =
      imageData;


    document
      .getElementById("previewArea")
      .classList.remove("hidden");


    /*
      Reset previous AI result.
    */

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
      "🤖";


    document
      .getElementById("confidenceFill")
      .style.width =
      "0%";


    document
      .getElementById("classifyButton")
      .disabled =
      false;


    document
      .getElementById("sendLedButton")
      .disabled =
      true;


    document
      .getElementById("saveButton")
      .disabled =
      true;


    showMessage(
      "Image ready for analysis.",
      "success"
    );

  };


  reader.readAsDataURL(file);

}


/* =========================================
   CLEAR IMAGE
========================================= */

function clearImage() {

  document
    .getElementById("imageInput")
    .value =
    "";


  document
    .getElementById("imagePreview")
    .src =
    "";


  document
    .getElementById("previewArea")
    .classList.add("hidden");


  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;

  imageData = null;


  document
    .getElementById("aiResult")
    .textContent =
    "Waiting for image...";


  document
    .getElementById("confidence")
    .textContent =
    "—";


  document
    .getElementById("reason")
    .textContent =
    "Analyze an image to generate the AI result and explanation.";


  document
    .getElementById("resultIcon")
    .textContent =
    "🤖";


  document
    .getElementById("confidenceFill")
    .style.width =
    "0%";


  document
    .getElementById("classifyButton")
    .disabled =
    true;


  document
    .getElementById("sendLedButton")
    .disabled =
    true;


  document
    .getElementById("saveButton")
    .disabled =
    true;

}


/* =========================================
   AI CLASSIFICATION
========================================= */

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
    "🤖 Analyzing...";


  try {

    const image =
      document.getElementById(
        "imagePreview"
      );


    const predictions =
      await model.predict(
        image,
        false
      );


    /*
      Find prediction with highest probability.
    */

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
      Normalize the class name.
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

    } else if (
      normalized.includes("possible")
    ) {

      currentAIResult =
        "Possible Breeding Site";

    } else {

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
      Change icon.
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
        "🔴";

    } else if (
      currentAIResult ===
      "Not a Possible Breeding Site"
    ) {

      resultIcon.textContent =
        "🟢";

    } else {

      resultIcon.textContent =
        "🤖";

    }


    /*
      Enable ESP32 button.
    */

    document
      .getElementById("sendLedButton")
      .disabled =
      false;


    /*
      Save button can now be used.
    */

    document
      .getElementById("saveButton")
      .disabled =
      false;


    showMessage(
      "AI classification completed.",
      "success"
    );


    console.log(
      "Predictions:",
      predictions
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


  classifyButton.disabled = false;

  classifyButton.textContent =
    "🤖 Analyze Image";

}


/* =========================================
   REASON GENERATOR
========================================= */

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
    "The AI model produced a classification that " +
    "does not match the expected MosquiScan categories."
  );

}


/* =========================================
   CONFIDENCE FORMAT
========================================= */

function formatConfidence(
  probability
) {

  return (
    (probability * 100)
      .toFixed(2) +
    "%"
  );

}


/* =========================================
   ESP32
========================================= */

function updateESPInitialStatus() {

  if (!ESP32_IP) {

    setESPStatus(
      "Not Configured",
      "error"
    );

    return;
  }


  setESPStatus(
    "Ready",
    "normal"
  );

}


/* =========================================
   SEND RESULT TO ESP32
========================================= */

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


/* =========================================
   ESP32 STATUS
========================================= */

function setESPStatus(
  status,
  type
) {

  const statusText =
    document.getElementById(
      "espStatus"
    );


  const dot =
    document.getElementById(
      "espDot"
    );


  statusText.textContent =
    "ESP32 " + status;


  dot.className =
    "status-dot";


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


/* =========================================
   MAP SETUP
========================================= */

function setupMap() {

  /*
    Default map location:
    Candijay / Bohol area.
  */

  map =
    L.map("map").setView(
      [9.8190, 124.4970],
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


  /*
    Add existing saved markers.
  */

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


/* =========================================
   CUSTOM MARKER ICON
========================================= */

function createMarkerIcon(
  type
) {

  return L.divIcon({

    className: "",

    html:
      '<div class="custom-marker ' +
      type +
      '"></div>',

    iconSize: [18, 18],

    iconAnchor: [9, 9],

    popupAnchor: [0, -10]

  });

}


/* =========================================
   SET MAP LOCATION
   DRAGGABLE TEMPORARY MARKER
========================================= */

function setMapLocation(
  latitude,
  longitude
) {

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {

    return;
  }


  /*
    Remove previous temporary marker.
  */

  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;
  }


  /*
    Temporary marker.

    It is draggable so the user can
    manually adjust the inspection location.
  */

  currentMarker =
    L.marker(
      [latitude, longitude],
      {
        draggable: true,

        icon:
          createMarkerIcon(
            "not-possible"
          )
      }
    ).addTo(map);


  currentMarker.bindPopup(
    "<strong>Inspection Location</strong>" +
    "<br>" +
    "Drag this marker to adjust the location."
  );


  /*
    Update coordinates when marker is dragged.
  */

  currentMarker.on(
    "dragend",
    function(event) {

      const position =
        event.target.getLatLng();


      document.getElementById(
        "latitude"
      ).value =
      position.lat.toFixed(6);


      document.getElementById(
        "longitude"
      ).value =
      position.lng.toFixed(6);


      showMessage(
        "Inspection location updated.",
        "success"
      );

    }
  );


  /*
    Move map to location.
  */

  map.setView(
    [latitude, longitude],
    Math.max(
      map.getZoom(),
      16
    )
  );


  /*
    Open popup.
  */

  currentMarker.openPopup();

}


/* =========================================
   CURRENT LOCATION
========================================= */

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


      document.getElementById(
        "latitude"
      ).value =
      latitude.toFixed(6);


      document.getElementById(
        "longitude"
      ).value =
      longitude.toFixed(6);


      setMapLocation(
        latitude,
        longitude
      );


      showMessage(
        "Current location added. You can drag the marker to change it.",
        "success"
      );

    },


    function(error) {

      console.error(
        "Geolocation error:",
        error
      );


      showMessage(
        "Could not get your location. Please allow location permission or enter the coordinates manually.",
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


/* =========================================
   MANUAL COORDINATES → MAP
========================================= */

function updateMapFromCoordinates() {

  const latitude =
    parseFloat(
      document.getElementById(
        "latitude"
      ).value
    );


  const longitude =
    parseFloat(
      document.getElementById(
        "longitude"
      ).value
    );


  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {

    return;
  }


  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {

    showMessage(
      "Invalid latitude or longitude.",
      "error"
    );

    return;
  }


  setMapLocation(
    latitude,
    longitude
  );

}


/* =========================================
   CLEAR LOCATION
========================================= */

function clearLocation() {

  document.getElementById(
    "latitude"
  ).value = "";


  document.getElementById(
    "longitude"
  ).value = "";


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


/* =========================================
   ADD SAVED RECORD MARKER
========================================= */

function addRecordMarker(
  record
) {

  if (
    record.latitude === null ||
    record.longitude === null ||
    record.latitude === "" ||
    record.longitude === ""
  ) {

    return;
  }


  const latitude =
    parseFloat(
      record.latitude
    );


  const longitude =
    parseFloat(
      record.longitude
    );


  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {

    return;
  }


  let markerType =
    "not-possible";


  if (
    record.result ===
    "Possible Breeding Site"
  ) {

    markerType =
      "possible";

  }


  const marker =
    L.marker(
      [latitude, longitude],
      {
        icon:
          createMarkerIcon(
            markerType
          )
      }
    ).addTo(map);


  /*
    Build popup.
  */

  let popupHTML =
    '<div class="map-popup">';


  popupHTML +=
    "<strong>" +
    escapeHTML(
      record.result
    ) +
    "</strong>";


  popupHTML +=
    "<p><b>Confidence:</b> " +
    escapeHTML(
      record.confidence || "—"
    ) +
    "</p>";


  popupHTML +=
    "<p><b>Date:</b> " +
    escapeHTML(
      record.date || "—"
    ) +
    "</p>";


  popupHTML +=
    "<p><b>Reason:</b> " +
    escapeHTML(
      record.reason || "—"
    ) +
    "</p>";


  if (record.notes) {

    popupHTML +=
      "<p><b>Notes:</b> " +
      escapeHTML(
        record.notes
      ) +
      "</p>";

  }


  if (record.image) {

    popupHTML +=
      '<img src="' +
      record.image +
      '" alt="Inspection image">';

  }


  popupHTML +=
    "</div>";


  marker.bindPopup(
    popupHTML
  );

}


/* =========================================
   SAVE INSPECTION
========================================= */

function saveInspection() {

  if (!imageData) {

    showMessage(
      "Please upload an image first.",
      "error"
    );

    return;
  }


  if (!currentAIResult) {

    showMessage(
      "Analyze the image before saving.",
      "error"
    );

    return;
  }


  const latitudeValue =
    document.getElementById(
      "latitude"
    ).value;


  const longitudeValue =
    document.getElementById(
      "longitude"
    ).value;


  const notes =
    document.getElementById(
      "notes"
    ).value.trim();


  const now =
    new Date();


  const record = {

    id:
      Date.now(),

    image:
      imageData,

    result:
      currentAIResult,

    confidence:
      currentConfidence
        ? formatConfidence(
            currentConfidence
          )
        : "—",

    reason:
      currentReason,

    latitude:
      latitudeValue,

    longitude:
      longitudeValue,

    notes:
      notes,

    date:
      now.toLocaleString()

  };


  /*
    Add record.
  */

  records.unshift(
    record
  );


  /*
    Save to browser local storage.
  */

  try {

    localStorage.setItem(
      "mosquiscanRecords",
      JSON.stringify(
        records
      )
    );

  } catch (error) {

    console.error(
      "Local storage error:",
      error
    );


    showMessage(
      "The record is too large for browser storage. Try using a smaller image.",
      "error"
    );

    return;
  }


  /*
    Add marker to map.
  */

  if (
    latitudeValue &&
    longitudeValue
  ) {

    addRecordMarker(
      record
    );

  }


  /*
    Update dashboard.
  */

  updateDashboard();


  /*
    Refresh record display.
  */

  renderRecords();


  /*
    Send result to ESP32.
  */

  if (ESP32_IP) {

    sendResultToESP32();

  }


  showMessage(
    "Inspection record saved successfully.",
    "success"
  );


  /*
    Clear current inspection.
  */

  clearInspectionForm();

}


/* =========================================
   CLEAR INSPECTION FORM
========================================= */

function clearInspectionForm() {

  document.getElementById(
    "imageInput"
  ).value = "";


  document.getElementById(
    "imagePreview"
  ).src = "";


  document
    .getElementById(
      "previewArea"
    )
    .classList.add(
      "hidden"
    );


  document.getElementById(
    "aiResult"
  ).textContent =
  "Waiting for image...";


  document.getElementById(
    "confidence"
  ).textContent =
  "—";


  document.getElementById(
    "reason"
  ).textContent =
  "Analyze an image to generate the AI result and explanation.";


  document.getElementById(
    "resultIcon"
  ).textContent =
  "🤖";


  document.getElementById(
    "confidenceFill"
  ).style.width =
  "0%";


  document.getElementById(
    "latitude"
  ).value = "";


  document.getElementById(
    "longitude"
  ).value = "";


  document.getElementById(
    "notes"
  ).value = "";


  document.getElementById(
    "classifyButton"
  ).disabled =
  true;


  document.getElementById(
    "sendLedButton"
  ).disabled =
  true;


  document.getElementById(
    "saveButton"
  ).disabled =
  true;


  imageData = null;

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  /*
    Remove temporary marker.
  */

  if (currentMarker) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }

}


/* =========================================
   DASHBOARD
========================================= */

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


  document.getElementById(
    "totalRecords"
  ).textContent =
  total;


  document.getElementById(
    "possibleSites"
  ).textContent =
  possible;


  document.getElementById(
    "notPossibleSites"
  ).textContent =
  notPossible;

}


/* =========================================
   RENDER RECORDS
========================================= */

function renderRecords() {

  const container =
    document.getElementById(
      "recordsContainer"
    );


  if (!records.length) {

    container.innerHTML = `

      <div class="empty-records">

        <div class="empty-icon">
          📂
        </div>

        <h3>
          No inspection records yet
        </h3>

        <p>
          Analyze and save an inspection
          to see it here.
        </p>

      </div>

    `;

    return;
  }


  container.innerHTML =
    "";


  records.forEach(
    record => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "record-card";


      const resultClass =
        record.result ===
        "Possible Breeding Site"
          ? "possible"
          : "not-possible";


      card.innerHTML = `

        <img
          class="record-image"
          src="${record.image}"
          alt="Inspection image"
        >

        <div class="record-content">

          <div class="record-top">

            <div
              class="record-result ${resultClass}"
            >
              ${
                record.result ===
                "Possible Breeding Site"
                  ? "🔴 "
                  : "🟢 "
              }

              ${escapeHTML(
                record.result
              )}

            </div>

            <div class="record-date">
              ${escapeHTML(
                record.date
              )}
            </div>

          </div>


          <div class="record-details">

            <div class="record-detail">

              <span>
                Confidence
              </span>

              <strong>
                ${escapeHTML(
                  record.confidence || "—"
                )}
              </strong>

            </div>


            <div class="record-detail">

              <span>
                Latitude
              </span>

              <strong>
                ${escapeHTML(
                  record.latitude || "—"
                )}
              </strong>

            </div>


            <div class="record-detail">

              <span>
                Longitude
              </span>

              <strong>
                ${escapeHTML(
                  record.longitude || "—"
                )}
              </strong>

            </div>


            <div class="record-detail">

              <span>
                Record ID
              </span>

              <strong>
                ${record.id}
              </strong>

            </div>

          </div>


          <div class="record-reason">

            <strong>
              Reason:
            </strong>

            ${escapeHTML(
              record.reason || "—"
            )}

          </div>


          ${
            record.notes
              ? `
                <div class="record-notes">

                  <strong>
                    Notes:
                  </strong>

                  ${escapeHTML(
                    record.notes
                  )}

                </div>
              `
              : ""
          }

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================
   ESCAPE HTML
========================================= */

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


/* =========================================
   MESSAGE
========================================= */

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


  if (
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
