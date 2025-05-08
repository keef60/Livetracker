const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.addEventListener("loadeddata", processFrame);
}

async function processFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Assuming tagDetector is an instance of the AprilTag detector
  const tags = tagDetector.detect(imageData);
  
  tags.forEach(tag => {
    console.log("Detected Tag ID:", tag.id);
    // Optionally draw box on canvas
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    tag.corners.forEach((corner, i) => {
      const next = tag.corners[(i + 1) % 4];
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(next.x, next.y);
    });
    ctx.stroke();
  });

  requestAnimationFrame(processFrame);
}

// Load the AprilTag WebAssembly
let tagDetector;
AprilTag().then((module) => {
  tagDetector = new module.AprilTagDetector();
  startCamera();
});
