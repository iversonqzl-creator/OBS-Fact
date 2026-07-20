export default function PreviewTable({ columns, rows }) {
  if (!rows || rows.length === 0) return null;
  const keys = columns && columns.length
    ? columns
    : ["Fact#", "Facts", "Title", "Scope", "File Name", "Keyword", "Area", "Team Area", "Reviewer"];
  return (
    <div className="overflow-x-auto border border-border" data-testid="preview-table">
      <table className="w-full min-w-[1100px] border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {keys.map((k) => (
              <th key={k} className="whitespace-nowrap border-r border-white/20 px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.12em] last:border-r-0">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r["File Name"]}-${r["Fact#"]}-${i}`} className="border-t border-border odd:bg-surface hover:bg-muted/60" data-testid={`preview-row-${i}`}>
              {keys.map((k) => (
                <td key={k} className={`border-r border-border px-3 py-2 align-top text-foreground last:border-r-0 ${k === "Facts" ? "min-w-[360px] max-w-[460px]" : "max-w-[240px] truncate"}`} title={r[k] || ""}>
                  {k === "Fact#" ? (
                    <span className="inline-block bg-muted px-2 py-0.5 font-mono text-xs text-foreground">{r[k]}</span>
                  ) : (r[k] || <span className="text-muted-foreground">—</span>)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
