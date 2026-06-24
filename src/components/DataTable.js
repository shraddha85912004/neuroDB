'use client';

import { useState, useMemo } from 'react';
import { Inbox } from 'lucide-react';

const SKIP_COLUMNS = new Set(['_id', 'id']);

export default function DataTable({ data, columns: columnsProp }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  // Auto-detect columns from the first data item when not provided
  const columns = useMemo(() => {
    if (columnsProp && columnsProp.length > 0) return columnsProp;
    if (!data || data.length === 0) return [];
    return Object.keys(data[0])
      .filter((key) => !SKIP_COLUMNS.has(key))
      .map((key) => ({
        key,
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim(),
      }));
  }, [data, columnsProp]);

  // Filter rows by search term across all visible columns
  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(term);
      }),
    );
  }, [data, search, columns]);

  // Sort filtered rows
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage,
  );

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setPage(0);
  }

  function handleRowsPerPageChange(e) {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  }

  // ── Empty state ──────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <span style={styles.emptyIcon}><Inbox size={48} /></span>
        <p style={styles.emptyTitle}>No data to display</p>
        <p style={styles.emptySubtitle}>
          Try a different query to see results here.
        </p>
      </div>
    );
  }

  // ── Table ────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search results…"
          value={search}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />
        <div style={styles.rowsControl}>
          <label htmlFor="dt-rows" style={styles.rowsLabel}>
            Rows
          </label>
          <select
            id="dt-rows"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            style={styles.rowsSelect}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...styles.th,
                      ...(isActive ? styles.thActive : {}),
                    }}
                  >
                    <span style={styles.thContent}>
                      {col.label}
                      <span style={styles.sortArrow}>
                        {isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={styles.noMatch}>
                  No matching rows found.
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={idx}
                  style={styles.tr}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'rgba(88, 166, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={styles.td}>
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <span style={styles.pageInfo}>
          {sorted.length === 0
            ? 'No results'
            : `Showing ${currentPage * rowsPerPage + 1}–${Math.min(
                (currentPage + 1) * rowsPerPage,
                sorted.length,
              )} of ${sorted.length}`}
        </span>
        <div style={styles.pageButtons}>
          <button
            disabled={currentPage === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{
              ...styles.pageBtn,
              ...(currentPage === 0 ? styles.pageBtnDisabled : {}),
            }}
          >
            ← Previous
          </button>
          <span style={styles.pageNum}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            style={{
              ...styles.pageBtn,
              ...(currentPage >= totalPages - 1 ? styles.pageBtnDisabled : {}),
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatCell(value) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? '✔' : '✘';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// ── Styles (using CSS variable references) ──────────────────

const styles = {
  wrapper: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'var(--panel-bg)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid var(--border-color)',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1 1 200px',
    minWidth: '180px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  rowsControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  rowsLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  rowsSelect: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    padding: '0.35rem 0.5rem',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  thActive: {
    color: 'var(--accent-color)',
  },
  thContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  sortArrow: {
    fontSize: '0.65rem',
    opacity: 0.7,
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background 0.15s',
  },
  td: {
    padding: '0.65rem 1rem',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  noMatch: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-secondary)',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderTop: '1px solid var(--border-color)',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  pageInfo: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  pageButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  pageBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  pageNum: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    background: 'var(--panel-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  emptyTitle: {
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  emptySubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
};
