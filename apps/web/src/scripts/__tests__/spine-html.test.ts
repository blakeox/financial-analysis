import { describe, expect, it } from 'vitest';
import {
  chipClass,
  renderChip,
  renderDataTableCell,
  renderDataTableHeaderCell,
  renderKeyValueRow,
  renderLegendItem,
  renderProgressBar,
  spineCopyClasses,
} from '../_shared/spine-html';

describe('spine-html', () => {
  it('exposes semantic copy classes', () => {
    expect(spineCopyClasses.panelTitle).toBe('fa-panel-title');
    expect(spineCopyClasses.dataTableCell).toBe('fa-data-table-cell');
  });

  it('renders chips with fa-chip variants', () => {
    expect(renderChip('Active', 'success')).toBe(
      '<span class="fa-chip fa-chip-success">Active</span>'
    );
    expect(chipClass('muted')).toBe('fa-chip fa-chip-muted');
  });

  it('renders legend items with optional swatch styles', () => {
    const html = renderLegendItem('Principal', { swatchStyle: 'background-color: #6d4aff' });
    expect(html).toContain('fa-list-copy-strong');
    expect(html).toContain('background-color: #6d4aff');
  });

  it('renders progress bars and table helpers', () => {
    expect(renderProgressBar(75)).toContain('fa-progress-track');
    expect(renderDataTableCell('42', 'right')).toContain('fa-data-table-cell text-right');
    expect(renderDataTableHeaderCell('Amount', 'right')).toContain(
      'fa-data-table-header text-right'
    );
    expect(renderKeyValueRow('Label', 'Value')).toContain('fa-script-copy-muted');
  });
});
