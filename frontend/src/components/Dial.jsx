// A single circular gauge: a needle rotated to `value` degrees from
// straight up for relative actuators, or CCW from east for heading, drawn with
// plain inline SVG (no charting library needed for something this simple).
export default function Dial({ label, value, color = '#d64545', size = 90, isHeading = false }) {
  const radius = size / 2;
  const needleLength = radius * 0.7;
  const displayValue = Number.isFinite(value) ? value : 0;
  const tickCount = 36;

  const ticks = [];
  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * 2 * Math.PI;
    const isMajor = i % 3 === 0;
    const tickLength = 10;
    const x1 = Math.cos(angle) * (radius - tickLength);
    const y1 = Math.sin(angle) * (radius - tickLength);
    const x2 = Math.cos(angle) * radius;
    const y2 = Math.sin(angle) * radius;
    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--dial-tick)"
        strokeWidth={isMajor ? 2 : 1}
      />
    );
  }

  return (
    <div className="dial">
      <svg width={size} height={size}>
        <g transform={`translate(${radius}, ${radius})`}>
          <circle r={radius - 1} fill="var(--dial-face)" stroke="var(--dial-border)" strokeWidth={2} />
          {ticks}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-needleLength}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            transform={`rotate(${isHeading ? 90 - displayValue : displayValue})`}
            style={{ transition: 'transform 400ms ease-out' }}
          />
          <circle r={4} fill="var(--dial-hub)" />
        </g>
      </svg>
      <div className="dial-label">{label}</div>
      <div className="dial-value">{displayValue.toFixed(1)}°</div>
    </div>
  );
}
