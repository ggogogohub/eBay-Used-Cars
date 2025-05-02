import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  /**
   * Remove a toast from the display
   * @param id The ID of the toast to remove
   */
  removeToast(id: number): void {
    this.toastService.remove(id);
  }

  /**
   * Get the Bootstrap class for a toast based on its type
   * @param type The toast type
   * @returns The corresponding Bootstrap class
   */
  getToastClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-success text-white';
      case 'error':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning text-dark';
      case 'info':
        return 'bg-info text-dark';
      default:
        return 'bg-light text-dark';
    }
  }

  /**
   * Get the icon for a toast based on its type
   * @param type The toast type
   * @returns The corresponding Bootstrap icon class
   */
  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi-exclamation-circle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-bell-fill';
    }
  }
}
