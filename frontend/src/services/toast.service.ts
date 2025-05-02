import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private counter = 0;

  constructor() {}

  /**
   * Show a success toast notification
   * @param message The message to display
   * @param timeout Optional timeout in milliseconds (default: 3000)
   */
  success(message: string, timeout: number = 3000): void {
    this.show({
      id: this.getNextId(),
      message,
      type: 'success',
      timeout
    });
  }

  /**
   * Show an error toast notification
   * @param message The message to display
   * @param timeout Optional timeout in milliseconds (default: 5000)
   */
  error(message: string, timeout: number = 5000): void {
    this.show({
      id: this.getNextId(),
      message,
      type: 'error',
      timeout
    });
  }

  /**
   * Show an info toast notification
   * @param message The message to display
   * @param timeout Optional timeout in milliseconds (default: 3000)
   */
  info(message: string, timeout: number = 3000): void {
    this.show({
      id: this.getNextId(),
      message,
      type: 'info',
      timeout
    });
  }

  /**
   * Show a warning toast notification
   * @param message The message to display
   * @param timeout Optional timeout in milliseconds (default: 4000)
   */
  warning(message: string, timeout: number = 4000): void {
    this.show({
      id: this.getNextId(),
      message,
      type: 'warning',
      timeout
    });
  }

  /**
   * Show a toast notification
   * @param toast The toast to show
   */
  private show(toast: Toast): void {
    this.toasts = [...this.toasts, toast];
    this.toastsSubject.next(this.toasts);

    if (toast.timeout) {
      setTimeout(() => this.remove(toast.id), toast.timeout);
    }
  }

  /**
   * Remove a toast notification by ID
   * @param id The ID of the toast to remove
   */
  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastsSubject.next(this.toasts);
  }

  /**
   * Get the next available toast ID
   * @returns A unique ID for a toast
   */
  private getNextId(): number {
    return ++this.counter;
  }
}
