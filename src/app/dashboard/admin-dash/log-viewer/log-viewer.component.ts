import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AgGridModule } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  CsvExportModule,
  SideBarDef
} from 'ag-grid-community';
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
  error$: Observable<string | null>;

  selectedCategory: string = '';
  selectedTimeRange: string = '24h';
  searchTerm: string = '';

  categories = Object.values(LogCategory);
  gridApi: GridApi | null = null;

  filteredRowData: LogEntry[] = [];
  sideBar: SideBarDef = {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel',
      }
    ],
    defaultToolPanel: ''
  };

  gridOptions: GridOptions = {
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true
    },
    enableRangeSelection: true,
    animateRows: true,
    rowHeight: 48,
    headerHeight: 48,
    rowClass: 'log-row',
    suppressContextMenu: true,
    rowSelection: 'single',
    pagination: true,
    paginationPageSize: 50,
    suppressPaginationPanel: false,
    getRowClass: this.getRowClass.bind(this),
    tooltipShowDelay: 0,
    tooltipHideDelay: 2000,
    sideBar: this.sideBar
  };

  columnDefs: ColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      minWidth: 180,
      flex: 1,
      valueFormatter: this.formatTimestamp.bind(this),
      sort: 'desc',
      filter: 'agDateColumnFilter',
      tooltipValueGetter: (params) => this.formatFullTimestamp(params.value)
    },
    {
      field: 'userName',
      headerName: 'User',
      minWidth: 150,
      flex: 1,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'userRole',
      headerName: 'Role',
      minWidth: 120,
      flex: 1,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'category',
      headerName: 'Category',
      minWidth: 140,
      flex: 1,
      cellRenderer: this.categoryRenderer.bind(this),
      filter: 'agSetColumnFilter',
      filterParams: {
        values: this.categories
      }
    },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 160,
      flex: 1,
      filter: 'agTextColumnFilter',
      cellClass: 'action-cell'
    },
    {
      field: 'message',
      headerName: 'Message',
      minWidth: 300,
      flex: 2,
      wrapText: true,
      autoHeight: true,
      cellClass: 'message-cell',
      filter: 'agTextColumnFilter'
    }
  ];

  constructor(
    private store: Store,
    private spinner: SpinnerService
  ) {
    this.logs$ = this.store.select(LogSelectors.selectAllLogs);
    this.loading$ = this.store.select(LogSelectors.selectLogsLoading);
    this.error$ = this.store.select(LogSelectors.selectLogsError);
  }

  ngOnInit(): void {
    ModuleRegistry.registerModules([ ClientSideRowModelModule, CsvExportModule ]);
    this.refreshLogs();

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

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;

    this.gridApi.sizeColumnsToFit();

    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.gridApi?.sizeColumnsToFit();
      });
    });
  }

  refreshLogs(): void {
    this.spinner.show();
    this.store.dispatch(LogActions.loadLogs());
  }

  applyFilters(logs: LogEntry[]): void {
    let filtered = logs.filter(log => log !== null && log !== undefined);

    if (this.selectedCategory) {
      filtered = filtered.filter(log => log.category === this.selectedCategory);
    }

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

    if (this.searchTerm) {
      const termLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        (log.userName?.toLowerCase().includes(termLower) ||
          log.action?.toLowerCase().includes(termLower) ||
          log.message?.toLowerCase().includes(termLower)));
    }

    this.filteredRowData = filtered.filter(log =>
      log.id || log.timestamp || log.message || log.action || log.category
    );

    if (this.gridApi) {
      (this.gridApi as any).setRowData(this.filteredRowData);
    }
  }

  filterLogs(): void {
    this.logs$.subscribe(logs => {
      this.applyFilters(logs);
    }).unsubscribe();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterLogs();
  }

  getRowClass(params: any): string {
    if (!params.data) return '';

    const category = params.data.category;
    return `log-row log-${category?.toLowerCase()}`;
  }

  formatTimestamp(params: any): string {
    if (!params.value) return '';

    const date = new Date(params.value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
              date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatFullTimestamp(timestamp: number): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  categoryRenderer(params: any): HTMLElement {
    if (!params.value) return document.createElement('span');

    const category = params.value;
    const span = document.createElement('span');
    span.innerText = category;
    span.className = `category-badge category-${category.toLowerCase()}`;

    return span;
  }

  exportCsv(): void {
    if (!this.gridApi) return;

    const params = {
      fileName: `school-logs-${new Date().toISOString().split('T')[0]}.csv`,
      columnKeys: this.columnDefs.map(col => col.field)
    };

    (this.gridApi as any).exportDataAsCsv(params);
  }

  exportAsJson(): void {
    if (!this.filteredRowData || this.filteredRowData.length === 0) return;

    const dataStr = JSON.stringify(this.filteredRowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `school-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}
