import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../services/statistics.service';

@Component({
  selector: 'statistics',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  summary: any = {};
  countsByType: any[] = [];
  averagePriceByType: any[] = [];
  isLoading = true;
  error = '';

  constructor(private statisticsService: StatisticsService) { }

  ngOnInit() {
    this.loadStatistics();
  }

  loadStatistics() {
    this.isLoading = true;
    this.error = '';

    // Load summary statistics
    this.statisticsService.getListingsSummary().subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.countsByType = response.counts_by_type;
        this.loadAveragePriceByType();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Failed to load summary statistics. Please try again later.';
        console.error('Error loading summary statistics:', error);
      }
    });
  }

  loadAveragePriceByType() {
    this.statisticsService.getAveragePriceByType().subscribe({
      next: (response) => {
        this.averagePriceByType = response.stats;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Failed to load average price statistics. Please try again later.';
        console.error('Error loading average price statistics:', error);
      }
    });
  }
}
