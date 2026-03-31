import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { validateTicket, scanTicket } from '../api/tickets';
import './QRScanner.css';

const QRScanner = ({ onScanComplete }) => {
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      });

      scanner.render(
        async (decodedText) => {
          scanner.clear().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          await handleScan(decodedText);
        },
        (err) => {
          // Ignore scan errors (no QR found in frame)
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const handleScan = async (decodedText) => {
    setProcessing(true);
    setError(null);
    try {
      let payload;
      try {
        payload = JSON.parse(decodedText);
      } catch {
        setError('Invalid QR code format');
        setProcessing(false);
        return;
      }

      const { ticketNumber } = payload;
      if (!ticketNumber) {
        setError('QR code does not contain a valid ticket number');
        setProcessing(false);
        return;
      }

      // First validate
      const validateRes = await validateTicket({ ticketNumber });
      const ticket = validateRes.data.data.ticket;

      // Then mark as used
      const scanRes = await scanTicket(ticket._id);
      const scannedTicket = scanRes.data.data.ticket;

      setResult({
        success: true,
        message: 'Ticket scanned successfully!',
        ticket: scannedTicket,
      });

      if (onScanComplete) onScanComplete(scannedTicket);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Scan failed';
      setError(msg);
      setResult({ success: false, message: msg });
    } finally {
      setProcessing(false);
    }
  };

  const startScanning = () => {
    setResult(null);
    setError(null);
    setScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="qr-scanner">
      <h3>QR Code Scanner</h3>

      {!scanning && (
        <button className="btn-start-scan" onClick={startScanning}>
          📷 Start Camera Scan
        </button>
      )}

      {scanning && (
        <>
          <div id="qr-reader" className="qr-reader-container"></div>
          <button className="btn-stop-scan" onClick={stopScanning}>
            ✕ Stop Scanning
          </button>
        </>
      )}

      {processing && (
        <div className="qr-processing">
          <span className="spinner"></span> Processing ticket...
        </div>
      )}

      {result && (
        <div className={`qr-result ${result.success ? 'qr-result--success' : 'qr-result--error'}`}>
          <p className="qr-result__message">
            {result.success ? '✅' : '❌'} {result.message}
          </p>
          {result.ticket && (
            <div className="qr-result__details">
              <p><strong>Ticket #:</strong> {result.ticket.ticketNumber}</p>
              <p><strong>Status:</strong> {result.ticket.isUsed ? 'Used' : 'Valid'}</p>
              {result.ticket.scannedAt && (
                <p><strong>Scanned at:</strong> {new Date(result.ticket.scannedAt).toLocaleString()}</p>
              )}
            </div>
          )}
          <button className="btn-scan-again" onClick={startScanning}>
            Scan Another
          </button>
        </div>
      )}

      {error && !result && (
        <div className="qr-result qr-result--error">
          <p>❌ {error}</p>
          <button className="btn-scan-again" onClick={startScanning}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
