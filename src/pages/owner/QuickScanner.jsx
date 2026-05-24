import { useEffect, useState } from "react";
import QrScanner from "react-qr-barcode-scanner";
import api from "../../api/axios";

export default function QuickScanner() {
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [cameraDenied, setCameraDenied] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    // Probe permissions API when available to detect instant denials
    try {
      if (navigator && navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: "camera" })
          .then((result) => {
            setCameraDenied(result.state === "denied");
            result.onchange = () => setCameraDenied(result.state === "denied");
          })
          .catch(() => {});
      }

      if (
        navigator &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            stream.getTracks().forEach((t) => t.stop());
          })
          .catch((err) => {
            if (
              err &&
              (err.name === "NotAllowedError" ||
                err.name === "PermissionDeniedError")
            ) {
              setCameraDenied(true);
            }
          });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUpdate = async (err, result) => {
    if (err) return;
    if (!result) return;
    if (paused) return;
    setPaused(true);
    const scannedText = result?.text || (result?.getText && result.getText());
    setMessage("Processing scan...");
    setStatus(null);

    // Safely parse scanned QR text into JSON object
    let parsedData = null;
    if (typeof scannedText === "string") {
      try {
        parsedData = JSON.parse(scannedText);
      } catch (parseErr) {
        setMessage("Invalid QR Code format");
        setStatus("error");
        return;
      }
    } else if (typeof scannedText === "object") {
      parsedData = scannedText;
    } else {
      setMessage("Invalid QR Code format");
      setStatus("error");
      return;
    }

    // Ensure memberId exists
    if (!parsedData || !parsedData.memberId) {
      setMessage("Invalid QR Code: missing memberId");
      setStatus("error");
      return;
    }

    try {
      const resp = await api.post("/attendance/scan-qr", parsedData);
      if (resp?.data?.success) {
        setMessage(resp.data.message || "Check-in successful");
        setStatus("success");
      } else {
        setMessage(resp?.data?.message || "Scan failed");
        setStatus("error");
      }
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Scan request failed",
      );
      setStatus("error");
    }
  };

  const handleScanNext = () => {
    setMessage(null);
    setStatus(null);
    setPaused(false);
    setScannerKey((current) => current + 1);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Quick Scanner</h1>

      {cameraDenied ? (
        <div className="rounded-md p-4 bg-yellow-50 text-yellow-800">
          Camera access denied. Please enable camera permissions in your browser
          settings or use a device with an available camera.
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl overflow-hidden bg-black/80">
            {!paused && (
              <div className="w-full">
                <QrScanner
                  key={scannerKey}
                  onUpdate={handleUpdate}
                  facingMode="environment"
                />
              </div>
            )}

            {paused && (
              <div className="p-4 text-center">
                {status === "success" ? (
                  <div className="text-green-600 font-semibold">{message}</div>
                ) : status === "error" ? (
                  <div className="text-red-600 font-semibold">{message}</div>
                ) : (
                  <div className="text-slate-800">{message}</div>
                )}

                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-white"
                  onClick={handleScanNext}
                >
                  Scan Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
