import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon } from "lucide-react";
import { Dialog } from "./Dialog";
export function Camera({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | undefined;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access needs a secure connection. Upload a photo instead.",
      );
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
        audio: false,
      })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() =>
        setError(
          "Camera access wasn’t available. Allow camera access in your browser, or upload a photo instead.",
        ),
      );
    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  function capture() {
    const v = video.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(new File([blob], "My home.jpg", { type: "image/jpeg" }));
          onClose();
        }
      },
      "image/jpeg",
      0.95,
    );
  }
  return (
    <Dialog title="Capture your home" onClose={onClose}>
      <p className="muted">
        Step back and include the whole roof. Bright, even daylight works best.
      </p>
      {error ? (
        <p role="alert" className="error-box">
          {error}
        </p>
      ) : (
        <video
          className="camera-view"
          ref={video}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setReady(true)}
        />
      )}
      <button
        className="primary full"
        onClick={capture}
        disabled={!ready || !!error}
      >
        <CameraIcon size={18} /> Take photo
      </button>
    </Dialog>
  );
}
