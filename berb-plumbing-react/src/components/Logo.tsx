interface LogoProps {
  href?: string;
  showIcon?: boolean;
}

export default function Logo({ href = "#top", showIcon = false }: LogoProps) {
  return (
    <a className="brand-logo" href={href} aria-label="BERB – back to top">
      {showIcon && (
        <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true">
          <circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="17" r="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" />
        </svg>
      )}
      <span>BERB</span>
    </a>
  );
}
