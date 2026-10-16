import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin, X } from "lucide-react";
import { office } from "../config/office";

interface MapModalProps {
  onClose: () => void;
}

export default function MapModal({ onClose }: MapModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Open native dialog + lock body scroll
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();
    document.body.style.overflow = "hidden";
    // Focus the close button on open
    closeRef.current?.focus();

    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => {
      el.removeEventListener("cancel", onCancel);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Click on backdrop (the dialog element itself) → close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="map-modal"
      aria-label={`Map: ${office.name}`}
      onClick={handleBackdropClick}
    >
      <div className="map-modal-inner">
        {/* Header */}
        <div className="map-modal-header">
          <div className="map-modal-title">
            <MapPin size={18} aria-hidden="true" />
            <span>{office.name}</span>
          </div>
          <div className="map-modal-actions">
            <a
              href={office.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-dark"
              aria-label="Get directions (opens in new tab)"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Get Directions
            </a>
            <button
              ref={closeRef}
              type="button"
              className="map-modal-close"
              onClick={onClose}
              aria-label="Close map"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Map iframe */}
        <div className="map-modal-body">
          {/* Loading overlay — sits on top until iframe fires onLoad */}
          {!iframeLoaded && (
            <div className="map-loading" aria-hidden="true">
              <span className="map-loading-dot" />
              <span className="map-loading-dot" />
              <span className="map-loading-dot" />
            </div>
          )}
          <iframe
            src={office.embedUrl}
            title={`Google Maps: ${office.name}`}
            width="100%"
            height="100%"
            referrerPolicy="no-referrer-when-downgrade"
            style={{
              border: 0,
              display: "block",
              opacity: iframeLoaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
            onLoad={() => setIframeLoaded(true)}
            allowFullScreen
          />
          {/* Fallback link if embedding is blocked */}
          {!iframeLoaded && (
            <p className="map-fallback">
              Map not loading?{" "}
              <a href={office.directionsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
