import { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    async function startCamera() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        setError('Camera permission denied or camera not found. Please upload a photo instead.');
      }
    }
    startCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function takeSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onCapture(file);
    }, 'image/jpeg', 0.92);
  }

  function handleSnapClick() {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 800);
  }

  return (
    <div className="webcam-container">
      {error ? (
        <div style={{ color: '#ffd6cc', padding: 20, textAlign: 'center', fontSize: 12 }}>
          <AlertCircle size={28} style={{ margin: '0 auto 8px', color: '#ff8a73' }} />
          <p>{error}</p>
          <button className="camera-toggle-btn" onClick={onClose} style={{ marginTop: 10 }}>
            Return to File Upload
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
          <div className="webcam-guide-oval" />
          {countdown !== null && (
            <div
              style={{
                position: 'absolute',
                fontSize: 64,
                fontFamily: 'var(--app-font-serif)',
                color: '#ffffff',
                textShadow: '0 4px 15px rgba(0,0,0,0.6)',
                zIndex: 10,
              }}
            >
              {countdown}
            </div>
          )}
          <div className="webcam-actions">
            <button className="webcam-snap-btn" onClick={handleSnapClick} disabled={countdown !== null}>
              <Camera size={14} /> {countdown !== null ? 'Capturing…' : 'Take Selfie'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 0,
                color: '#fff',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'grid',
                placeItems: 'center',
              }}
              title="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
