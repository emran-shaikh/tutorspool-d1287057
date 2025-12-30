import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { createReview, Session } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  onReviewSubmitted: () => void;
}

export default function ReviewDialog({ open, onOpenChange, session, onReviewSubmitted }: ReviewDialogProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userProfile || !session.id || rating === 0) return;
    
    setSubmitting(true);
    try {
      await createReview({
        sessionId: session.id,
        studentId: userProfile.uid,
        studentName: userProfile.fullName,
        tutorId: session.tutorId,
        tutorName: session.tutorName,
        rating,
        comment,
        subject: session.subject,
        createdAt: new Date().toISOString()
      });

      // Fire-and-forget thank you email for review
      try {
        if (session.studentEmail) {
          const baseUrl = import.meta.env.VITE_SUPABASE_URL;
          const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          await fetch(`${baseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: apiKey,
            },
            body: JSON.stringify({
              type: 'review_thankyou',
              to: session.studentEmail,
              studentName: userProfile.fullName,
              tutorName: session.tutorName,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to trigger review thank you email:', err);
      }
      
      toast({ 
        title: "Review submitted!", 
        description: "Thank you for your feedback" 
      });
      onOpenChange(false);
      onReviewSubmitted();
      setRating(0);
      setComment("");
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to submit review", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {session.tutorName} for the {session.subject} session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}