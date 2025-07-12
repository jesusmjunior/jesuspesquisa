
import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-stone-500'}`}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 22 20"
  >
    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.455 8.516l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.545 8.516a1.535 1.535 0 0 0 .379-.891Z" />
  </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 5 }) => {
  const roundedRating = Math.round(rating);

  return (
    <div className="flex items-center mt-2" title={`Rating: ${rating.toFixed(1)} out of ${maxRating}`}>
      {Array.from({ length: maxRating }, (_, index) => (
        <StarIcon key={index} filled={index < roundedRating} />
      ))}
       <span className="ml-1.5 text-xs text-stone-300 font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;