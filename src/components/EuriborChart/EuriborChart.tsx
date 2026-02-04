import './EuriborChart.scss';

export interface EuriborSeries {
  /** Mes global de inicio del periodo (1-based) */
  startMonth: number;
  /** Valores de Euribor (%) por mes del periodo */
  values: number[];
}

interface EuriborChartProps {
  /** Una serie por periodo variable (ordenadas por startMonth) */
  series: EuriborSeries[];
  /** Ancho del gráfico */
  width?: number;
  /** Alto del gráfico */
  height?: number;
}

export function EuriborChart({
  series,
  width = 600,
  height = 200,
}: EuriborChartProps) {
  const points: { month: number; value: number }[] = [];
  for (const s of series) {
    s.values.forEach((value, i) => {
      points.push({ month: s.startMonth + i, value });
    });
  }
  if (points.length === 0) return null;

  const months = points.map((p) => p.month);
  const values = points.map((p) => p.value);
  const minMonth = Math.min(...months);
  const maxMonth = Math.max(...months);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const rangeMonth = maxMonth - minMonth || 1;
  const rangeVal = maxVal - minVal || 1;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const x = (month: number) =>
    padding.left + ((month - minMonth) / rangeMonth) * chartWidth;
  const y = (value: number) =>
    padding.top + chartHeight - ((value - minVal) / rangeVal) * chartHeight;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.month)} ${y(p.value)}`)
    .join(' ');

  const ticksY = 5;
  const yTicks = Array.from({ length: ticksY + 1 }, (_, i) => {
    const v = minVal + (rangeVal * i) / ticksY;
    return { value: v, y: y(v) };
  });

  return (
    <div className="euribor-chart">
      <h3 className="euribor-chart-title">Simulación Euribor</h3>
      <svg
        className="euribor-chart-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="#e0e0e0"
            strokeDasharray="2"
          />
        ))}
        <text
          x={padding.left - 8}
          y={padding.top + chartHeight / 2}
          textAnchor="end"
          dominantBaseline="middle"
          className="euribor-chart-axis-label"
        >
          %
        </text>
        <path
          d={pathD}
          fill="none"
          stroke="#0066cc"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={tick.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="euribor-chart-tick"
          >
            {tick.value.toFixed(1)}
          </text>
        ))}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 8}
          textAnchor="middle"
          className="euribor-chart-axis-label"
        >
          Mes
        </text>
      </svg>
    </div>
  );
}
