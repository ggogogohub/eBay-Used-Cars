import { Component, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() coordinates: [number, number] | null = null;
  @Input() height: string = '300px';
  @Input() zoom: number = 13;
  @Input() locationName: string = 'Vehicle Location';

  // Generate a unique ID for each map instance
  public mapId: string = 'map-' + Math.random().toString(36).substring(2, 9);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor() {
    // Fix Leaflet's default icon paths
    this.fixLeafletIcon();
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure the DOM is fully rendered
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coordinates'] && this.map) {
      this.updateMarker();
    }
  }

  private initMap(): void {
    try {
      // Create map only if coordinates are provided
      if (!this.coordinates) {
        console.log('No coordinates provided for map');
        return;
      }

      console.log('Initializing map with coordinates:', this.coordinates);

      // Check if the map container exists
      const mapElement = document.getElementById('map-' + this.mapId);
      if (!mapElement) {
        console.error('Map container element not found with ID:', 'map-' + this.mapId);
        return;
      }

      // Initialize the map
      this.map = L.map('map-' + this.mapId).setView(this.coordinates, this.zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Add marker
      this.updateMarker();

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private updateMarker(): void {
    if (!this.map || !this.coordinates) return;

    // Remove existing marker if any
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Use our custom car marker icon
    const carIcon = this.createCarMarkerIcon();

    // Add new marker with custom car icon
    this.marker = L.marker(this.coordinates, { icon: carIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup-content">
          <strong>${this.locationName}</strong>
          <p>Lat: ${this.coordinates[0].toFixed(4)}, Lng: ${this.coordinates[1].toFixed(4)}</p>
        </div>
      `)
      .openPopup();

    // Center map on marker
    this.map.setView(this.coordinates, this.zoom);
  }

  /**
   * Fix for Leaflet's default icon path issues
   * This function sets the correct paths for Leaflet's default marker icons
   */
  private fixLeafletIcon(): void {
    // Get the default icon prototype
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';

    // Set default icon paths
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl
    });
  }

  /**
   * Creates a custom car marker icon for the map
   * Uses Bootstrap Icons for the car icon
   */
  private createCarMarkerIcon(): L.DivIcon {
    return L.divIcon({
      html: `
        <div class="car-marker">
          <i class="bi bi-car-front"></i>
        </div>
      `,
      className: 'car-marker-container',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  }
}
