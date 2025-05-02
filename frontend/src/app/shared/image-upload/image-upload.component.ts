import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../services/cloudinary.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.css'
})
export class ImageUploadComponent {
  @Input() multiple = false;
  @Input() maxFiles = 5;
  @Input() existingImages: any[] = [];
  @Output() imagesUploaded = new EventEmitter<any[]>();

  selectedFiles: File[] = [];
  uploadProgress = 0;
  isUploading = false;
  errorMessage = '';
  previewUrls: string[] = [];
  previewTypes: string[] = []; // Store the type of each preview (image or video)

  constructor(private cloudinaryService: CloudinaryService) {}

  ngOnInit() {
    // Initialize preview URLs from existing images if any
    if (this.existingImages && this.existingImages.length > 0) {
      this.previewUrls = this.existingImages.map(img => img.url);

      // Initialize preview types based on URLs
      this.previewTypes = this.previewUrls.map(url => this.getMediaType(url));
    }
  }

  /**
   * Determine if a URL is for an image or video
   * @param url The URL to check
   * @returns 'video' if it's a video URL, 'image' otherwise
   */
  getMediaType(url: string): string {
    // Check if the URL contains video or common video extensions
    if (url.includes('/video/') ||
        url.toLowerCase().endsWith('.mp4') ||
        url.toLowerCase().endsWith('.webm') ||
        url.toLowerCase().endsWith('.ogg') ||
        url.toLowerCase().endsWith('.mov')) {
      return 'video';
    }
    return 'image';
  }

  onFileSelected(event: any) {
    this.errorMessage = '';
    const files: FileList = event.target.files;

    if (files.length === 0) {
      return;
    }

    // Check if we're exceeding the maximum number of files
    if (this.multiple && files.length + this.previewUrls.length > this.maxFiles) {
      this.errorMessage = `You can only upload a maximum of ${this.maxFiles} images.`;
      return;
    }

    // Clear previous selections if not multiple
    if (!this.multiple) {
      this.selectedFiles = [];
      this.previewUrls = [];
    }

    // Add new files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.match(/image\/*/) && !file.type.match(/video\/*/) ) {
        this.errorMessage = 'Only images and videos are supported.';
        continue;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        this.errorMessage = 'File size should not exceed 50MB.';
        continue;
      }

      this.selectedFiles.push(file);

      // Determine file type
      const isVideo = file.type.startsWith('video/');

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
        this.previewTypes.push(isVideo ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please select files to upload.';
      return false;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    if (this.multiple) {
      this.cloudinaryService.uploadMultipleImages(this.selectedFiles).subscribe({
        next: (response) => {
          this.isUploading = false;
          this.uploadProgress = 100;
          this.imagesUploaded.emit(response.images);

          // Clear selected files after successful upload
          this.selectedFiles = [];
          return true;
        },
        error: (error) => {
          this.isUploading = false;
          this.errorMessage = error.error?.error || 'Failed to upload images. Please try again.';
          console.error('Error uploading images:', error);
          return false;
        }
      });
    } else {
      this.cloudinaryService.uploadImage(this.selectedFiles[0]).subscribe({
        next: (response) => {
          this.isUploading = false;
          this.uploadProgress = 100;
          this.imagesUploaded.emit([response]);

          // Clear selected files after successful upload
          this.selectedFiles = [];
          return true;
        },
        error: (error) => {
          this.isUploading = false;
          this.errorMessage = error.error?.error || 'Failed to upload image. Please try again.';
          console.error('Error uploading image:', error);
          return false;
        }
      });
    }

    return true; // Return true to indicate upload has started
  }

  removeFile(index: number) {
    this.previewUrls.splice(index, 1);
    this.previewTypes.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  removeExistingImage(index: number) {
    if (this.existingImages && this.existingImages.length > index) {
      this.existingImages.splice(index, 1);
      this.previewUrls.splice(index, 1);
      this.previewTypes.splice(index, 1);
      this.imagesUploaded.emit(this.existingImages);
    }
  }

  /**
   * Check if there are files selected but not uploaded
   * @returns true if there are files to upload, false otherwise
   */
  hasFilesToUpload(): boolean {
    return this.selectedFiles.length > 0;
  }
}
