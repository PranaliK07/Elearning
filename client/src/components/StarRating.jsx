// frontend/src/components/StarRating.jsx
import React from 'react';

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleMouseEnter = (index) => {
    if (!readonly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readonly) setHoverRating(0);
  };

  const handleClick = (index) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index);
    }
  };

  const getStarClass = (index) => {
    const value = readonly ? rating : (hoverRating || rating);
    if (index <= value) return 'star-filled';
    return 'star-empty';
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${getStarClass(star)}`}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(star)}
          style={{ cursor: readonly ? 'default' : 'pointer', fontSize: '24px' }}
        >
          {getStarClass(star) === 'star-filled' ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

export default StarRating;
