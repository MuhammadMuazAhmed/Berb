import { Phone } from "lucide-react";

const trustPoints = ["1HR CALL OUT", "CLEAR PRICES", "GAS SAFE", "SERVING LONDON"];

export default function StatsSection() {
  return (
    <section className="stats-banner" aria-label="Customer trust and emergency service information">
      <div className="container">
        <div className="stats-banner-shell">
          <div className="stats-banner-strip" aria-label="Trust points">
            {trustPoints.map((point, index) => (
              <span key={point} className="stats-banner-item">
                {point}
                {index < trustPoints.length - 1 && <span className="stats-banner-dot" aria-hidden="true">•</span>}
              </span>
            ))}
          </div>

          <div className="stats-emergency-card">
            <div className="stats-emergency-icon" aria-hidden="true">
              <Phone size={58} strokeWidth={1.6} />
            </div>

            <div className="stats-emergency-copy">
              <h3>Call for Emergencies</h3>
              <p>We’re open 24/7 every day of the year!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
