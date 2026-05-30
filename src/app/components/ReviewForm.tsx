import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Review } from '../types';
import { toast } from 'sonner';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  tourId: string;
  tourTitle: string;
  userId: string;
  userName: string;
  userAvatar: string;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  open,
  onClose,
  bookingId,
  tourId,
  tourTitle,
  userId,
  userName,
  userAvatar,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!comment.trim()) {
      toast.error('Vui lòng viết nhận xét');
      return;
    }

    setLoading(true);

    try {
      // Get existing reviews
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

      const newReview: Review = {
        id: Date.now().toString(),
        tourId,
        bookingId,
        userId,
        userName,
        userAvatar,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      reviews.push(newReview);
      localStorage.setItem('reviews', JSON.stringify(reviews));

      // Update booking to mark as reviewed
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const updatedBookings = bookings.map((b: any) =>
        b.id === bookingId ? { ...b, hasReview: true } : b
      );
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));

      // Dispatch event to refresh data
      window.dispatchEvent(new Event('reviewsUpdated'));
      window.dispatchEvent(new Event('bookingsUpdated'));

      toast.success('Cảm ơn bạn đã đánh giá!');
      onReviewSubmitted?.();
      onClose();

      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Đánh giá tour</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{tourTitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Đánh giá của bạn <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {rating === 0 && 'Chọn số sao'}
              {rating === 1 && 'Rất tệ'}
              {rating === 2 && 'Tệ'}
              {rating === 3 && 'Trung bình'}
              {rating === 4 && 'Tốt'}
              {rating === 5 && 'Tuyệt vời'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="text-sm font-medium mb-2 block">
              Nhận xét của bạn <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối thiểu 10 ký tự ({comment.length}/10)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || rating === 0 || comment.length < 10}>
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
