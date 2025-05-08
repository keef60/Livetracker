const { useEffect, useRef, useState }= React;

const ARCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
  
    // Create the AR detector and initialize everything
    const detectorInstance = new AR.Detector();
    setDetector(detectorInstance);

    // Access user media (camera stream)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            if ('srcObject' in videoRef.current) {
              videoRef.current.srcObject = stream;
            } else {
              videoRef.current.src = window.URL.createObjectURL(stream);
            }
          }
        })
        .catch((err) => {
          console.error(err.name + ": " + err.message);
        });
    }

    const canvas = canvasRef.current;
    canvas.width = parseInt(canvas.style.width);
    canvas.height = parseInt(canvas.style.height);

    const context = canvas.getContext('2d');

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        snapshot(context);
        if (detector) {
          const markers = detector.detect(imageData);
          drawCorners(context, markers);
          drawIds(context, markers);
        }
      }
      requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);

    return () => {
      // Cleanup the stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [detector, imageData]);

  const snapshot = (context) => {
    if (videoRef.current && canvasRef.current) {
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const newImageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      setImageData(newImageData);
    }
  };

  const drawCorners = (context, markers) => {
    context.lineWidth = 3;
    markers.forEach((marker) => {
      const corners = marker.corners;

      context.strokeStyle = 'red';
      context.beginPath();

      corners.forEach((corner, index) => {
        const nextCorner = corners[(index + 1) % corners.length];
        context.moveTo(corner.x, corner.y);
        context.lineTo(nextCorner.x, nextCorner.y);
      });

      context.stroke();
      context.closePath();

      context.strokeStyle = 'green';
      context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    });
  };

  const drawId = (context, markers) => {
    context.strokeStyle = 'blue';
    context.lineWidth = 1;

    markers.forEach((marker) => {
      const corners = marker.corners;
      let x = Infinity;
      let y = Infinity;

      corners.forEach((corner) => {
        x = Math.min(x, corner.x);
        y = Math.min(y, corner.y);
      });

      context.strokeText(marker.id, x, y);
    });
  };

  const drawIds = (context, markers) => {
    const REAL_MARKER_SIZE = 5.0; // cm
    const FOCAL_LENGTH = 700;     // px — adjust or calibrate for accuracy

    context.fillStyle = 'blue';
    context.font = '16px monospace';

    markers.forEach((marker) => {
      const corners = marker.corners;

      // Pixel width of marker in the image
      const dx = corners[0].x - corners[1].x;
      const dy = corners[0].y - corners[1].y;
      const pixelSize = Math.sqrt(dx * dx + dy * dy);

      // Distance in cm
      const distanceCm = (FOCAL_LENGTH * REAL_MARKER_SIZE) / pixelSize;

      // Convert to inches and feet
      const distanceInches = distanceCm / 2.54;
      const feet = Math.floor(distanceInches / 12);
      const inches = (distanceInches % 12).toFixed(1);

      // Marker label position
      const x = Math.min(...corners.map(c => c.x));
      const y = Math.min(...corners.map(c => c.y)) - 10;

      context.fillText(`ID: ${marker.id}`, x, y);
      context.fillText(`~${feet}' ${inches}"`, x, y + 15);
    });
  };
  return (
    <div>
        1243
      <video ref={videoRef} id="video" style={{ display: 'none' }} />
      <canvas ref={canvasRef} id="canvas" width="640" height="480" style={{ border: '1px solid black' }} />
    </div>
  );
};

ReactDOM.render(<ARCamera />, document.getElementById('root'));
