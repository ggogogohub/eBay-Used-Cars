import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'review',
  imports: [CommonModule, FormsModule],
  templateUrl: './review.component.html',
  styleUrl: './review.component.css'
})
export class ReviewComponent {
  @Input() review: any;
  @Input() editable: boolean = false;
  @Output() updateReview = new EventEmitter<any>();
  
  isEditing = false;
  editedReview = {
    review_text: '',
    rating: 5
  };

  startEditing() {
    this.editedReview = {
      review_text: this.review.review_text,
      rating: this.review.rating
    };
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  saveReview() {
    this.updateReview.emit({
      reviewId: this.review._id,
      review_text: this.editedReview.review_text,
      rating: this.editedReview.rating
    });
    this.isEditing = false;
  }

  // Helper method to generate an array for star rating display
  generateRatingArray(rating: number): number[] {
    return Array(rating).fill(0).map((_, i) => i + 1);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
