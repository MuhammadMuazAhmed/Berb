import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";
import reviewsImage from "../assets/688f0cc99930d3597c0aaa26_berb-references-hero-image.jpg";
import Reveal from "./Reveal";

interface CustomerReview {
  id: string;
  name: string;
  relativeDate: string;
  rating: number;
  text: string;
  fullText?: string;
}

const reviews: CustomerReview[] = [
  {
    id: "warren-g",
    name: "Warren G",
    relativeDate: "5 months ago",
    rating: 5,
    text: "Friendly and efficient service",
  },
  {
    id: "nicholas-t",
    name: "Nicholas T",
    relativeDate: "5 months ago",
    rating: 5,
    text: "Prompt, friendly service. Parts and labour guaranteed for 12 months. Excellent two way communication...",
  },
  {
    id: "mert-t",
    name: "Mert T",
    relativeDate: "5 months ago",
    rating: 5,
    text: "Excellent service from Matt! He was professional, punctual, and explained everything clearly before starting the work. The plumbing issue was fixed...",
  },
  {
    id: "camilo-m",
    name: "Camilo M",
    relativeDate: "4 days ago",
    rating: 5,
    text: "Great service, Andy is very knowledgeable and efficient. Very happy with work done. Full boiler replacement.",
  },
  {
    id: "richard-j",
    name: "Richard J",
    relativeDate: "4 days ago",
    rating: 5,
    text: "Just had Luke and Joe round to remove two radiators and check the rest of the heating system. They are professional and friendly, without any...",
  },
  {
    id: "jp-t",
    name: "Jp T",
    relativeDate: "5 days ago",
    rating: 5,
    text: "Great job absolutely. Professionally handled everything. Thank you very much!",
  },
];

function GoogleMark() {
  return (
    <svg className="review-google-mark" viewBox="0 0 48 48" role="img" aria-label="Google">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v8h11.1c-.5 2.6-2 4.8-4.2 6.2l6.8 5.3c4-3.7 5.9-9.1 5.9-15.4Z" />
      <path fill="#34A853" d="M24 44c5.7 0 10.5-1.9 14-5.1l-6.8-5.3c-1.9 1.3-4.3 2.1-7.2 2.1-5.4 0-10-3.7-11.7-8.7l-7.1 5.5C8.7 39.4 15.7 44 24 44Z" />
      <path fill="#FBBC05" d="M12.3 27c-.4-1-.6-2-.6-3s.2-2 .6-3l-7.1-5.5C3.8 18.1 3 21 3 24s.8 5.9 2.2 8.5l7.1-5.5Z" />
      <path fill="#EA4335" d="M24 11.5c3.1 0 5.9 1.1 8.1 3.2l6.1-6.1C34.5 5.3 29.7 3 24 3 15.7 3 8.7 7.6 5.2 15.5l7.1 5.5c1.7-5 6.3-8.7 11.7-8.7Z" />
    </svg>
  );
}

function scrollReviewsByCard(viewport: HTMLDivElement, direction: -1 | 1) {
  const firstCard = viewport.querySelector<HTMLElement>(".review-card");
  const track = viewport.querySelector<HTMLElement>(".reviews-track");
  if (!firstCard || !track) return;
  const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
  viewport.scrollBy({
    left: direction * (firstCard.getBoundingClientRect().width + gap),
    behavior: "smooth",
  });
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchActiveRef = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const [expandedReviewIds, setExpandedReviewIds] = useState<string[]>([]);
  const [autoPaused, setAutoPaused] = useState(false);

  useEffect(() => {
    if (
      autoPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const intervalId = window.setInterval(() => {
      const viewport = viewportRef.current;
      const section = sectionRef.current;
      const carousel = section?.querySelector<HTMLElement>(".reviews-carousel");
      if (
        !viewport ||
        !section ||
        !carousel ||
        document.visibilityState === "hidden" ||
        carousel.matches(":hover") ||
        carousel.contains(document.activeElement) ||
        touchActiveRef.current
      ) return;
      const sectionBounds = section.getBoundingClientRect();
      if (sectionBounds.bottom <= 0 || sectionBounds.top >= window.innerHeight) return;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;

      if (viewport.scrollLeft >= maxScroll - 1) {
        viewport.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollReviewsByCard(viewport, 1);
      }
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [autoPaused]);

  const updateNavigation = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanGoBack(viewport.scrollLeft > 1);
    setCanGoForward(viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1);
  };

  const moveCarousel = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport) scrollReviewsByCard(viewport, direction);
  };

  const toggleExpanded = (reviewId: string) => {
    setExpandedReviewIds((current) =>
      current.includes(reviewId)
        ? current.filter((id) => id !== reviewId)
        : [...current, reviewId],
    );
  };

  const handleCarouselKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveCarousel(event.key === "ArrowLeft" ? -1 : 1);
    }
  };

  return (
    <section ref={sectionRef} className="section reviews-section" aria-labelledby="reviews-title">
      <div className="container reviews-inner">
        <div className="reviews-feature">
          <Reveal className="reviews-image" variant="fade" duration={0.9}>
            <img
              src={reviewsImage}
              alt="Modern bathroom renovation with shower, bath, and vanity fixtures"
              width={1497}
              height={1122}
              loading="lazy"
              decoding="async"
            />
          </Reveal>

          <Reveal className="reviews-copy" variant="slide-up" duration={0.9}>
            <p className="reviews-eyebrow"><span aria-hidden="true" />Customer Reviews</p>
            <h2 id="reviews-title">What Our Valued Clients Say</h2>
            <p>
              Read what our customers say about the quality of our plumbing, heating,
              solar, and related services.
            </p>
          </Reveal>
        </div>

        <div
          className="reviews-carousel"
          aria-label="Google customer reviews"
        >
          <button
            type="button"
            className="reviews-arrow reviews-arrow-previous"
            onClick={() => moveCarousel(-1)}
            disabled={!canGoBack}
            aria-label="Show previous reviews"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>

          <div
            className="reviews-viewport"
            ref={viewportRef}
            tabIndex={0}
            aria-label="Customer review cards. Use the arrow keys or swipe to browse."
            onScroll={updateNavigation}
            onKeyDown={handleCarouselKeyDown}
            onTouchStart={() => { touchActiveRef.current = true; }}
            onTouchEnd={() => { touchActiveRef.current = false; }}
            onTouchCancel={() => { touchActiveRef.current = false; }}
          >
            <div className="reviews-track">
              {reviews.map((review) => {
                const isExpanded = expandedReviewIds.includes(review.id);
                const body = isExpanded && review.fullText ? review.fullText : review.text;

                return (
                  <article className="review-card" key={review.id}>
                    <header className="review-card-header">
                      <div>
                        <h3>{review.name}</h3>
                        <time>{review.relativeDate}</time>
                      </div>
                      <GoogleMark />
                    </header>
                    <div className="review-rating" aria-label={`${review.rating} out of 5 stars`}>
                      <span className="review-stars" aria-hidden="true">
                        {Array.from({ length: review.rating }, (_, starIndex) => (
                          <Star key={starIndex} size={22} fill="currentColor" strokeWidth={1.5} />
                        ))}
                      </span>
                      <BadgeCheck className="review-badge" size={18} aria-label="Reviewer badge" />
                    </div>
                    <p className={`review-card-text${isExpanded ? " is-expanded" : ""}`}>
                      {body}
                    </p>
                    {review.fullText && review.fullText !== review.text && (
                      <button
                        type="button"
                        className="review-read-more"
                        onClick={() => toggleExpanded(review.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="reviews-arrow reviews-arrow-next"
            onClick={() => moveCarousel(1)}
            disabled={!canGoForward}
            aria-label="Show more reviews"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="reviews-footer">
          <p className="reviews-summary">
            <strong>5.0</strong> of 5, based on <strong>327 reviews</strong>
          </p>
          <button
            type="button"
            className="reviews-autoplay-toggle"
            onClick={() => setAutoPaused((paused) => !paused)}
            aria-pressed={autoPaused}
            aria-label={autoPaused ? "Resume automatic review rotation" : "Pause automatic review rotation"}
          >
            {autoPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            <span>{autoPaused ? "Resume rotation" : "Pause rotation"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}