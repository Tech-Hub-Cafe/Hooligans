"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/StarRating";
import { Review } from "@/data/reviews";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewsSectionProps {
  reviews: Review[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [reviewsPerSlide, setReviewsPerSlide] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive reviews per slide: 1 on mobile, 2 on tablet, 3 on desktop
  useEffect(() => {
    const updateReviewsPerSlide = () => {
      const newReviewsPerSlide =
        window.innerWidth >= 1024
          ? 3 // lg: desktop
          : window.innerWidth >= 768
          ? 2 // md: tablet
          : 1; // mobile

      setReviewsPerSlide((prev) => {
        if (prev !== newReviewsPerSlide) {
          // Reset to first slide when layout changes
          setCurrentIndex(0);
          return newReviewsPerSlide;
        }
        return prev;
      });
    };

    updateReviewsPerSlide();
    window.addEventListener("resize", updateReviewsPerSlide);
    return () => window.removeEventListener("resize", updateReviewsPerSlide);
  }, []);

  const totalSlides = Math.ceil(reviews.length / reviewsPerSlide);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && totalSlides > 1) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, totalSlides]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const getVisibleReviews = () => {
    const start = currentIndex * reviewsPerSlide;
    return reviews.slice(start, start + reviewsPerSlide);
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          What Our Customers <span className="text-teal">Say</span>
        </h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Don't just take our word for it - see what our customers are saying about their experience at Hooligans.
        </p>

        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel Wrapper */}
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => {
                const slideReviews = reviews.slice(
                  slideIndex * reviewsPerSlide,
                  slideIndex * reviewsPerSlide + reviewsPerSlide
                );
                return (
                  <div
                    key={slideIndex}
                    className="min-w-full flex gap-6 px-2"
                  >
                    {slideReviews.map((review) => (
                      <Card
                        key={review.id}
                        className="hover:shadow-lg transition-shadow duration-300 flex flex-col flex-1 min-w-0"
                      >
                        <CardContent className="flex flex-col flex-1 p-6">
                          {/* Author Info */}
                          <div className="flex items-center gap-4 mb-4">
                            {review.authorPhoto ? (
                              <Image
                                src={review.authorPhoto}
                                alt={review.authorName}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                {getInitials(review.authorName)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg">{review.authorName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={review.rating} size="sm" />
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Review Text */}
                          <p className="text-gray-700 leading-relaxed flex-1">
                            {review.text}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10 border border-gray-200"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10 border border-gray-200"
                aria-label="Next reviews"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-teal"
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Optional: Link to Google Reviews */}
        <div className="text-center mt-12">
          <a
            href="https://www.google.com/maps/place/Hooligans/@-33.7621405,151.2762364,17z/data=!4m8!3m7!1s0x6b12ab599f548c9d:0x3a1deb57195b707f!8m2!3d-33.7621405!4d151.2762364!9m1!1b1!16s%2Fg%2F11yxh3yxvb?entry=ttu&g_ep=EgoyMDI2MDEyNi4wIKXMDSoKLDEwMDc5MjA3MUgBUAM%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:text-teal-dark font-medium inline-flex items-center gap-2 transition-colors"
          >
            View all reviews on Google
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
