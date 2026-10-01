/* =========================================================
   MOSQUISCAN JAVASCRIPT
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

/*
  Put your ESP32 IP address here.

  Example:
  const ESP32_IP = "192.168.1.45";

  If you haven't connected the ESP32 yet,
  leave it empty.
*/

const ESP32_IP = "";


/*
  Your Teachable Machine model.
*/

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


/*
  Load previously saved records.
*/

let records =
  JSON.parse(
    localStorage.getItem("mosquiscanRecords")
  ) || [];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


async function initialize() {

  setupMap();

  setupEventListeners();

  updateDashboard();

  renderRecords();

  await loadAIModel();

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  const imageInput =
    document.getElementById("imageInput");

  const classifyButton =
    document.getElementById("classifyButton");

  const sendLedButton =
    document.getElementById("sendLedButton");

  const saveButton =
    document.getElementById("saveButton");

  const locationButton =
    document.getElementById("locationButton");

  const clearLocationButton =
    document.getElementById(
      "clearLocationButton"
    );

  const removeImageButton =
    document.getElementById(
      "removeImageButton"
    );


  imageInput.addEventListener(
    "change",
    handleImageSelection
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


  removeImageButton.addEventListener(
    "click",
    clearImageOnly
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
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
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
      "Could not load the AI model. Check your internet connection and model URL.",
      "error"
    );

  }

}


/* =========================================================
   IMAGE SELECTION
========================================================= */

function handleImageSelection(event) {

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

    imageData = e.target.result;


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
      Reset previous AI result
      when a new image is selected.
    */

    resetAIResult();


    document
      .getElementById("classifyButton")
      .disabled = false;


    document
      .getElementById("saveButton")
      .disabled = true;


    document
      .getElementById("sendLedButton")
      .disabled = true;


    showMessage(
      "Image ready for AI analysis.",
      "normal"
    );

  };


  reader.readAsDataURL(file);

}


/* =========================================================
   CLASSIFY IMAGE
========================================================= */

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
      "Please capture or upload an image first.",
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
    "⏳ Analyzing Image...";


  try {

    const image =
      document.getElementById(
        "imagePreview"
      );


    const predictions =
      await model.predict(image);


    /*
      Find the prediction
      with the highest probability.
    */

    let highest =
      predictions[0];


    for (
      let i = 1;
      i < predictions.length;
      i++
    ) {

      if (
        predictions[i].probability >
        highest.probability
      ) {

        highest =
          predictions[i];

      }

    }


    const className =
      highest.className;


    currentConfidence =
      highest.probability;


    /*
      Convert Teachable Machine
      class names into the
      official MosquiScan labels.
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


    currentReason =
      generateReason(
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
      "AI analysis completed.",
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


  button.disabled = false;

  button.textContent =
    "🔍 Analyze Image";

}


/* =========================================================
   GENERATE REASON
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
    "The AI classification does not match the " +
    "standard MosquiScan categories."
  );

}


/* =========================================================
   DISPLAY AI RESULT
========================================================= */

function displayAIResult() {

  const result =
    document.getElementById(
      "aiResult"
    );

  const confidence =
    document.getElementById(
      "confidence"
    );

  const reason =
    document.getElementById(
      "reason"
    );

  const icon =
    document.getElementById(
      "resultIcon"
    );


  result.textContent =
    currentAIResult;


  confidence.textContent =
    (
      currentConfidence * 100
    ).toFixed(2) + "%";


  reason.textContent =
    currentReason;


  if (
    currentAIResult ===
    "Possible Breeding Site"
  ) {

    icon.textContent = "🔴";

    icon.style.background =
      "#fff0f0";

  }

  else if (
    currentAIResult ===
    "Not a Possible Breeding Site"
  ) {

    icon.textContent = "🟢";

    icon.style.background =
      "#e9f8f1";

  }

  else {

    icon.textContent = "🧠";

    icon.style.background =
      "#eef4ff";

  }

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
   ESP32 STATUS
========================================================= */

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
    "ESP32: " + text;


  dot.className =
    "status-dot";


  if (
    type === "connected"
  ) {

    dot.classList.add(
      "connected"
    );

  }

  else if (
    type === "error"
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
    document.getElementById(
      "latitude"
    ).value;


  const longitude =
    document.getElementById(
      "longitude"
    ).value;


  const notes =
    document.getElementById(
      "notes"
    ).value;


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
      latitude || "",

    longitude:
      longitude || "",

    notes:
      notes || "",

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

  addRecordMarker(
    record
  );


  /*
    IMPORTANT:
    Automatically clear the
    entire inspection form.
  */

  clearInspectionForm();


  showMessage(
    "Inspection saved successfully. The form is now ready for the next inspection.",
    "success"
  );

}


/* =========================================================
   CLEAR INSPECTION FORM
========================================================= */

function clearInspectionForm() {

  /*
    Clear image input
  */

  const imageInput =
    document.getElementById(
      "imageInput"
    );

  imageInput.value = "";


  /*
    Clear image preview
  */

  const preview =
    document.getElementById(
      "imagePreview"
    );

  preview.src = "";


  document
    .getElementById(
      "previewArea"
    )
    .classList.add(
      "hidden"
    );


  /*
    Clear AI result
  */

  document.getElementById(
    "aiResult"
  ).textContent =
    "No image analyzed yet";


  document.getElementById(
    "confidence"
  ).textContent =
    "—";


  document.getElementById(
    "reason"
  ).textContent =
    "Analyze an image to generate an explanation";


  document.getElementById(
    "resultIcon"
  ).textContent =
    "🧠";


  document.getElementById(
    "resultIcon"
  ).style.background =
    "#e9f8f1";


  /*
    Clear location
  */

  document.getElementById(
    "latitude"
  ).value = "";


  document.getElementById(
    "longitude"
  ).value = "";


  /*
    Clear notes
  */

  document.getElementById(
    "notes"
  ).value = "";


  /*
    Disable buttons
  */

  document.getElementById(
    "classifyButton"
  ).disabled = true;


  document.getElementById(
    "sendLedButton"
  ).disabled = true;


  document.getElementById(
    "saveButton"
  ).disabled = true;


  /*
    Reset variables
  */

  imageData = null;

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  /*
    Remove temporary marker
  */

  if (
    currentMarker &&
    map
  ) {

    map.removeLayer(
      currentMarker
    );

    currentMarker = null;

  }

}


/* =========================================================
   CLEAR IMAGE ONLY
========================================================= */

function clearImageOnly() {

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


  resetAIResult();


  showMessage(
    "Image removed.",
    "normal"
  );

}


/* =========================================================
   RESET AI RESULT
========================================================= */

function resetAIResult() {

  currentAIResult = null;

  currentConfidence = null;

  currentReason = null;


  document.getElementById(
    "aiResult"
  ).textContent =
    "No image analyzed yet";


  document.getElementById(
    "confidence"
  ).textContent =
    "—";


  document.getElementById(
    "reason"
  ).textContent =
    "Analyze an image to generate an explanation";


  document.getElementById(
    "resultIcon"
  ).textContent =
    "🧠";


  document.getElementById(
    "resultIcon"
  ).style.background =
    "#e9f8f1";


  document.getElementById(
    "sendLedButton"
  ).disabled = true;


  document.getElementById(
    "saveButton"
  ).disabled = true;

}


/* =========================================================
   LOCATION
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

    function(position) {

      const lat =
        position.coords.latitude;


      const lng =
        position.coords.longitude;


      document.getElementById(
        "latitude"
      ).value =
        lat.toFixed(6);


      document.getElementById(
        "longitude"
      ).value =
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


    function(error) {

      console.error(
        "Location error:",
        error
      );


      showMessage(
        "Unable to get your location. Please allow location access or enter the coordinates manually.",
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

  document.getElementById(
    "latitude"
  ).value = "";


  document.getElementById(
    "longitude"
  ).value = "";


  if (
    currentMarker &&
    map
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
   MAP
========================================================= */

function setupMap() {

  map =
    L.map("map")
      .setView(
        [9.8190, 124.4970],
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


  /*
    Load markers from
    previously saved records.
  */

  records.forEach(
    function(record) {

      addRecordMarker(
        record
      );

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

  if (!map) {
    return;
  }


  map.setView(
    [lat, lng],
    17
  );


  if (
    currentMarker
  ) {

    map.removeLayer(
      currentMarker
    );

  }


  const markerIcon =
    createMarkerIcon(
      "not-possible"
    );


  currentMarker =
    L.marker(
      [lat, lng],
      {
        icon:
          markerIcon
      }
    )
      .addTo(map);


  currentMarker.bindPopup(
    "<strong>Current Inspection Location</strong>"
  ).openPopup();

}


/* =========================================================
   ADD RECORD MARKER
========================================================= */

function addRecordMarker(
  record
) {

  if (
    !map ||
    !record.latitude ||
    !record.longitude
  ) {

    return;

  }


  const lat =
    Number(
      record.latitude
    );


  const lng =
    Number(
      record.longitude
    );


  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
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


  const popup =
    `
      <div style="min-width:180px">

        <strong>
          ${escapeHTML(record.result)}
        </strong>

        <br><br>

        <b>Confidence:</b>
        ${
          (
            Number(record.confidence) *
            100
          ).toFixed(2)
        }%

        <br>

        <b>Date:</b>
        ${escapeHTML(record.date)}

        <br><br>

        ${
          record.image
            ? `<img
                src="${record.image}"
                style="
                  width:100%;
                  max-height:120px;
                  object-fit:cover;
                  border-radius:8px;
                "
              >`
            : ""
        }

      </div>
    `;


  marker.bindPopup(
    popup
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

    iconSize: [18, 18],

    iconAnchor: [9, 9]

  });

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  const total =
    records.length;


  const possible =
    records.filter(
      function(record) {

        return (
          record.result ===
          "Possible Breeding Site"
        );

      }
    ).length;


  const notPossible =
    records.filter(
      function(record) {

        return (
          record.result ===
          "Not a Possible Breeding Site"
        );

      }
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


/* =========================================================
   RENDER RECORDS
========================================================= */

function renderRecords() {

  const container =
    document.getElementById(
      "recordsContainer"
    );


  if (
    records.length === 0
  ) {

    container.innerHTML =

      `
        <div class="empty-records">

          <div>
            📂
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
    "";


  records.forEach(
    function(record) {

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


      card.innerHTML =

        `
          <img
            src="${record.image}"
            class="record-image"
            alt="Inspection image"
          >

          <div class="record-info">

            <span
              class="record-result ${resultClass}"
            >
              ${escapeHTML(record.result)}
            </span>

            <h3>
              Confidence:
              ${
                (
                  Number(record.confidence) *
                  100
                ).toFixed(2)
              }%
            </h3>

            <p>
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

            ${
              record.latitude &&
              record.longitude
                ? `
                  <p>
                    📍
                    ${escapeHTML(record.latitude)},
                    ${escapeHTML(record.longitude)}
                  </p>
                `
                : ""
            }

          </div>

          <div class="record-date">
            ${escapeHTML(record.date)}
          </div>
        `;


      container.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(value || "")
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
    "message-box show";


  if (
    type === "error"
  ) {

    box.classList.add(
      "error"
    );

  }

  else if (
    type === "success"
  ) {

    box.classList.add(
      "success"
    );

  }


  clearTimeout(
    messageTimer
  );


  messageTimer =
    setTimeout(
      function() {

        box.classList.remove(
          "show"
        );

      },
      3500
    );

}
