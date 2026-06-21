const resultField = document.querySelector("#qr-result");
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const statusText = document.querySelector("#status");
const cameraBox = document.querySelector("#camera-box");
const video = document.querySelector("#camera");
const canvas = document.querySelector("#qr-canvas");
const context = canvas.getContext("2d", { willReadFrequently: true });

let stream = null;
let animationFrameId = null;

function setStatus(message) {
  statusText.textContent = message;
}

function setScanningUi(isScanning) {
  startButton.hidden = isScanning;
  stopButton.hidden = !isScanning;
  cameraBox.hidden = !isScanning;
}

function stopScanning() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;
  setScanningUi(false);
  setStatus("已停止掃描。");
}

function scanFrame() {
  if (!stream || video.readyState !== video.HAVE_ENOUGH_DATA) {
    animationFrameId = requestAnimationFrame(scanFrame);
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (code) {
    resultField.value = code.data;
    setStatus("已讀取 QR code 內容。");
    stopScanning();
    return;
  }

  animationFrameId = requestAnimationFrame(scanFrame);
}

async function startScanning() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("這個瀏覽器不支援相機 API。");
    return;
  }

  if (typeof jsQR !== "function") {
    setStatus("QR code 掃描套件尚未載入，請確認網路或 CDN 連線。");
    return;
  }

  startButton.disabled = true;
  setStatus("正在開啟相機...");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
    setScanningUi(true);
    setStatus("請將 QR code 對準鏡頭。");
    scanFrame();
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
