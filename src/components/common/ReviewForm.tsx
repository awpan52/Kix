import { useState } from 'react';
import StarRating from './StarRating';

interface ReviewFormProps {
  onSubmit: (review: { userName: string; rating: number; comment: string }) => void;
  onCancel: () => void;
  defaultUserName?: string;
  hideNameInput?: boolean;
}

const ReviewForm = ({ onSubmit, onCancel, defaultUserName = '', hideNameInput = false }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState(defaultUserName);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; userName?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string; userName?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a star rating';
    }

    if (!hideNameInput) {
      if (!userName.trim()) {
        newErrors.userName = 'Please enter your name';
      } else if (userName.trim().length < 2) {
        newErrors.userName = 'Name must be at least 2 characters';
      }
    }

    if (!comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          userName: hideNameInput ? defaultUserName : userName.trim(),
          rating,
          comment: comment.trim(),
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
      <h3 className="font-cabinet font-bold text-lg text-text-dark mb-6">
        Write a Review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block font-cabinet font-medium text-text-dark mb-2">
            Your Rating <span className="text-discount-red">*</span>
          </label>
          <StarRating
            rating={rating}
            interactive
            onChange={setRating}
            size="lg"
          />
          {errors.rating && (
            <p className="font-cabinet text-sm text-discount-red mt-1">{errors.rating}</p>
          )}
        </div>

        {/* User Name - Only show if not logged in or no default name */}
        {!hideNameInput && (
          <div>
            <label
              htmlFor="userName"
              className="block font-cabinet font-medium text-text-dark mb-2"
            >
              Your Name <span className="text-discount-red">*</span>
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark transition-all ${
                errors.userName ? 'border-discount-red' : 'border-gray-200'
              }`}
            />
            {errors.userName && (
              <p className="font-cabinet text-sm text-discount-red mt-1">{errors.userName}</p>
            )}
          </div>
        )}

        {/* Show logged-in user's name */}
        {hideNameInput && defaultUserName && (
          <div>
            <label className="block font-cabinet font-medium text-text-dark mb-2">
              Posting as
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-text-dark rounded-full flex items-center justify-center">
                <span className="font-cabinet font-bold text-xs text-white">
                  {defaultUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-cabinet text-text-dark">{defaultUserName}</span>
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <label
            htmlFor="comment"
            className="block font-cabinet font-medium text-text-dark mb-2"
          >
            Your Review <span className="text-discount-red">*</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border font-cabinet text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-text-dark transition-all resize-none ${
              errors.comment ? 'border-discount-red' : 'border-gray-200'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment ? (
              <p className="font-cabinet text-sm text-discount-red">{errors.comment}</p>
            ) : (
              <span />
            )}
            <p className="font-cabinet text-sm text-gray-400">
              {comment.length}/500
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 rounded-lg font-cabinet font-bold transition-colors ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-card-bg text-white hover:bg-gray-800'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border-2 border-gray-200 text-text-dark font-cabinet font-bold rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
