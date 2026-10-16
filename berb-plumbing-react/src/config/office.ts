/**
 * Office / location configuration.
 * Single source of truth — imported by Footer and MapModal.
 * All values are public; no environment secrets needed.
 */
export const office = {
  name: "Prime Care Medical Center",
  lat: 33.646175,
  lng: 73.041809,
  /** Opens Google Maps directions in a new tab */
  directionsUrl: "https://maps.google.com/?q=33.646175,73.041809",
  /** Google Maps embed URL for the iframe */
  embedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2733.2549508815573!2d73.03923837486143!3d33.64617827331259!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38df959a4a1fa32f%3A0x3b18561572c0d5d3!2sPrime%20Care%20Medical%20Center!5e1!3m2!1sen!2s!4v1791869616120!5m2!1sen!2s",
} as const;
