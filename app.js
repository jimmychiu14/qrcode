const resultField = document.querySelector("#scan-result");
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const statusText = document.querySelector("#status");
const cameraBox = document.querySelector("#camera-box");
const video = document.querySelector("#camera");

let codeReader = null;
let scanControls = null;

const barcodeFormats = new Map([
  [0, "AZTEC"],
  [1, "CODABAR"],
  [2, "CODE_39"],
  [3, "CODE_93"],
  [4, "CODE_128"],
  [5, "DATA_MATRIX"],
  [6, "EAN_8"],
  [7, "EAN_13"],
  [8, "ITF"],
  [10, "PDF_417"],
  [11, "QR_CODE"],
  [14, "UPC_A"],
  [15, "UPC_E"],
]);

function setStatus(message) {
  statusText.textContent = message;
}

function setScanningUi(isScanning) {
  startButton.hidden = isScanning;
  stopButton.hidden = !isScanning;
  cameraBox.hidden = !isScanning;
}

function getFormatLabel(format) {
  return barcodeFormats.get(format) || "barcode";
}

function stopScanning(message = "已停止掃描。") {
  if (scanControls) {
    scanControls.stop();
    scanControls = null;
  }

  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }

  setScanningUi(false);
  setStatus(message);
}

async function startScanning() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("這個瀏覽器不支援相機 API。");
    return;
  }

  if (!window.ZXingBrowser?.BrowserMultiFormatReader) {
    setStatus("掃描套件尚未載入，請確認網路或 CDN 連線。");
    return;
  }

  startButton.disabled = true;
  setStatus("正在開啟相機...");

  try {
    codeReader = codeReader || new ZXingBrowser.BrowserMultiFormatReader();
    scanControls = await codeReader.decodeFromConstraints({
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    }, video, (result) => {
      if (!result) {
        return;
      }

      const format = getFormatLabel(result.getBarcodeFormat());

      resultField.value = result.getText();
      stopScanning(`已讀取 ${format} 內容。`);
    });

    setScanningUi(true);
    setStatus("請將 QR code 或 barcode 對準鏡頭。");
  } catch (error) {
    const message =
      error.name === "NotAllowedError"
        ? "相機權限被拒絕，請允許瀏覽器使用相機。"
        : "無法開啟相機，請確認裝置與瀏覽器權限。";

    setStatus(message);
  } finally {
    startButton.disabled = false;
  }
}

startButton.addEventListener("click", startScanning);
stopButton.addEventListener("click", stopScanning);
