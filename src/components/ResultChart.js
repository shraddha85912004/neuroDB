'use client';

import {
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = [
  '#58a6ff',
  '#bc8cff',
  '#50fa7b',
  '#ff79c6',
  '#ffb86c',
  '#8be9fd',
  '#f1fa8c',
  '#ff5555',
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(22, 27, 34, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f0f6fc',
    fontSize: '0.85rem',
  },
  itemStyle: { color: '#f0f6fc' },
  labelStyle: { color: '#8b949e', fontWeight: 600, marginBottom: '4px' },
};

import { BarChart2 } from 'lucide-react';

export default function ResultChart({ data, chartSuggestion }) {
  if (
    !chartSuggestion ||
    !data ||
    data.length === 0 ||
    !chartSuggestion.type
  ) {
    return (
      <div style={styles.empty}>
        <span style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}><BarChart2 size={48} /></span>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          No chart available for this query.
        </p>
      </div>
    );
  }

  const { type, xAxis, yAxis } = chartSuggestion;

  // Normalise yAxis to an array so we can support multi-series
  const yKeys = Array.isArray(yAxis) ? yAxis : [yAxis].filter(Boolean);

  switch (type) {
    case 'bar':
      return renderBarChart(data, xAxis, yKeys);
    case 'line':
      return renderLineChart(data, xAxis, yKeys);
    case 'pie':
      return renderPieChart(data, xAxis, yKeys[0]);
    default:
      return renderBarChart(data, xAxis, yKeys);
  }
}

// ── Bar Chart ──────────────────────────────────────────────

function renderBarChart(data, xAxis, yKeys) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey={xAxis}
          tick={{ fill: '#8b949e', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          tick={{ fill: '#8b949e', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#f0f6fc', fontSize: '0.85rem' }} />
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={PIE_COLORS[i % PIE_COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Line Chart ─────────────────────────────────────────────

function renderLineChart(data, xAxis, yKeys) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey={xAxis}
          tick={{ fill: '#8b949e', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          tick={{ fill: '#8b949e', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#f0f6fc', fontSize: '0.85rem' }} />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={PIE_COLORS[i % PIE_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: PIE_COLORS[i % PIE_COLORS.length], r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Pie Chart ──────────────────────────────────────────────

function renderPieChart(data, nameKey, valueKey) {
  // If valueKey is missing, try to use the first numeric field
  const resolvedValueKey =
    valueKey ||
    (data[0] &&
      Object.keys(data[0]).find(
        (k) => k !== nameKey && typeof data[0][k] === 'number',
      ));

  if (!resolvedValueKey) {
    return (
      <div style={styles.empty}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Cannot render pie chart — no numeric field found.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          dataKey={resolvedValueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={140}
          innerRadius={60}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} (${(percent * 100).toFixed(0)}%)`
          }
          labelLine={{ stroke: '#8b949e' }}
        >
          {data.map((_, i) => (
            <Cell
              key={`cell-${i}`}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ color: '#f0f6fc', fontSize: '0.85rem' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = {
  empty: {
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
    minHeight: '200px',
  },
};
