/** Graphiques SVG minimalistes rendus côté serveur (aucune bibliothèque). */
export function BarChart({ data, ariaLabel }: { data: { label: string; a: number; b: number }[]; ariaLabel: string }) {
  const max = Math.max(1, ...data.map((d) => d.a));
  const W = 600, H = 180, pad = 24, bw = (W - pad) / data.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad} x2={W} y1={H - t * (H - 10)} y2={H - t * (H - 10)} stroke="var(--border)" />
            <text x={0} y={H - t * (H - 10) + 4} fontSize="10" fill="var(--muted-foreground)">{Math.round(max * t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad + i * bw + bw * 0.18, w = bw * 0.64;
          const ha = (d.a / max) * (H - 10), hb = (d.b / max) * (H - 10);
          return (
            <g key={i}>
              <title>{`Semaine du ${d.label} : ${d.a} reçus, ${d.b} vendus`}</title>
              <rect x={x} y={H - ha} width={w} height={ha} rx="3" fill="var(--primary)" opacity="0.25" />
              <rect x={x} y={H - hb} width={w} height={hb} rx="3" fill="var(--primary)" />
              {i % 2 === 0 && <text x={x + w / 2} y={H + 14} fontSize="10" textAnchor="middle" fill="var(--muted-foreground)">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/25" />Reçus</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Vendus</span>
      </figcaption>
    </figure>
  );
}

export function HBars({ rows, format }: { rows: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-xs"><span>{r.label}</span><span className="tabular text-muted-foreground">{format(r.value)}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
