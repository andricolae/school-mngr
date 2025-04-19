// src/app/admin/log-viewer/log-viewer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AgGridModule } from 'ag-grid-angular';
import { ClientSideRowModelModule, ColDef, GridOptions, ModuleRegistry } from 'ag-grid-community';
import { Observable } from 'rxjs';

import { LogEntry, LogCategory } from '../../../core/user.model';
import * as LogActions from '../../../state/logs/log.actions';
import * as LogSelectors from '../../../state/logs/log.selector';
import { SpinnerComponent } from '../../../core/spinner/spinner.component';
import { SpinnerService } from '../../../core/services/spinner.service';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridModule,
    SpinnerComponent
  ],
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.css']
})
export class LogViewerComponent implements OnInit {
  logs$: Observable<LogEntry[]>;
  loading$: Observable<boolean>;

  selectedCategory: string = '';
  selectedTimeRange: string = '24h';
  categories = Object.values(LogCategory);

  gridOptions: GridOptions = {
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true
    },
    rowHeight: 40,
    headerHeight: 40,
    suppressContextMenu: true,
    getRowClass: params => {
      const category = params.data?.category;
      switch (category) {
        case LogCategory.AUTH: return 'log-auth';
        case LogCategory.GRADE: return 'log-grade';
        case LogCategory.COURSE: return 'log-course';
        case LogCategory.STUDENT: return 'log-student';
        case LogCategory.ATTENDANCE: return 'log-attendance';
        case LogCategory.ADMIN: return 'log-admin';
        case LogCategory.SYSTEM: return 'log-system';
        case LogCategory.NAVIGATION: return 'log-navigation';
        default: return '';
      }
    }
  };

  columnDefs: ColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 180,
      valueFormatter: params => new Date(params.value).toLocaleString()
    },
    {
      field: 'userName',
      headerName: 'User',
      width: 150
    },
    {
      field: 'userRole',
      headerName: 'Role',
      width: 120
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      cellClass: params => `category-${params.value.toLowerCase()}`
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150
    },
    {
      field: 'message',
      headerName: 'Message',
      width: 500,
      wrapText: true,
      autoHeight: true
    }
  ];

  filteredRowData: LogEntry[] = [];

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {
    this.logs$ = this.store.select(LogSelectors.selectAllLogs);
    this.loading$ = this.store.select(LogSelectors.selectLogsLoading);
  }

  ngOnInit(): void {
    ModuleRegistry.registerModules([ClientSideRowModelModule]);

    this.refreshLogs();

    this.logs$.subscribe(logs => {
      console.log('Logs received in component:', logs);
      this.applyFilters(logs);
      console.log('After filtering, logs count:', this.filteredRowData.length);
      console.log('First few logs:', this.filteredRowData.slice(0, 3));
    });

    this.logs$.subscribe(logs => {
      this.applyFilters(logs);
    });

    this.loading$.subscribe(loading => {
      if (loading) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    });
  }

  refreshLogs(): void {
    this.store.dispatch(LogActions.loadLogs());
  }

  filterLogs(): void {
    this.logs$.subscribe(logs => {
      this.applyFilters(logs);
    }).unsubscribe();
  }

  applyFilters(logs: LogEntry[]): void {
    let filtered = [...logs];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(log => log.category === this.selectedCategory);
    }

    // Filter by time range
    const now = Date.now();
    let timeThreshold = 0;

    switch (this.selectedTimeRange) {
      case '1h':
        timeThreshold = now - (60 * 60 * 1000);
        break;
      case '6h':
        timeThreshold = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        timeThreshold = now - (24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeThreshold = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        timeThreshold = 0;
    }

    if (timeThreshold > 0) {
      filtered = filtered.filter(log => log.timestamp >= timeThreshold);
    }

    this.filteredRowData = filtered;
  }
}
