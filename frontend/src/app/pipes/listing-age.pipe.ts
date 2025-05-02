import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'listingAge',
  standalone: true,
  pure: false // Make the pipe impure so it updates on every change detection cycle
})
export class ListingAgePipe implements PipeTransform {
  transform(value: any): string {
    // If we have a listing object with _id, use that to calculate the age
    if (value && typeof value === 'object' && value._id) {
      return this.getTimeFromObjectId(value._id);
    }

    // If we have a listing_age field (for backward compatibility)
    if (value && value.listing_age !== undefined) {
      return this.formatTimeFromDays(value.listing_age);
    }

    // If we just have a number or string representing days
    if (value !== undefined && value !== null) {
      // Convert to number if it's a string
      const days = typeof value === 'string' ? parseInt(value, 10) : value;

      if (!isNaN(days)) {
        return this.formatTimeFromDays(days);
      }
    }

    return 'Just now';
  }

  /**
   * Calculate time ago from MongoDB ObjectId
   * @param objectId MongoDB ObjectId as string
   * @returns Formatted time ago string
   */
  private getTimeFromObjectId(objectId: string): string {
    try {
      // Extract timestamp from ObjectId (first 4 bytes)
      if (objectId && objectId.length >= 24) {
        const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
        const createdAt = new Date(timestamp);
        const now = new Date();

        // Calculate time difference in milliseconds
        const diff = now.getTime() - createdAt.getTime();

        // Convert to minutes, hours, days, etc.
        const minutes = diff / (1000 * 60);
        const hours = minutes / 60;
        const days = hours / 24;

        return this.formatTimeAgo(minutes, hours, days);
      }
    } catch (error) {
      console.error('Error calculating time from ObjectId:', error);
    }

    return 'Just now';
  }

  /**
   * Format time ago from days
   * @param days Number of days
   * @returns Formatted time ago string
   */
  private formatTimeFromDays(days: number): string {
    // Convert days to minutes and hours
    const minutes = days * 24 * 60;
    const hours = days * 24;

    return this.formatTimeAgo(minutes, hours, days);
  }

  /**
   * Format time ago based on minutes, hours, and days
   * @param minutes Minutes elapsed
   * @param hours Hours elapsed
   * @param days Days elapsed
   * @returns Formatted time ago string
   */
  private formatTimeAgo(minutes: number, hours: number, days: number): string {
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      // Less than an hour
      const mins = Math.floor(minutes);
      return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
    } else if (hours < 24) {
      // Less than a day
      const hrs = Math.floor(hours);
      return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
    } else if (days < 7) {
      // Less than a week
      const d = Math.floor(days);
      return d === 1 ? 'Yesterday' : `${d} days ago`;
    } else if (days < 30) {
      // Less than a month
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (days < 365) {
      // Less than a year
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      // More than a year
      const years = Math.floor(days / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }
}
