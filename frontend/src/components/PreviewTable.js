export default function PreviewTable({ columns, rows }) {
  if (!rows || rows.length === 0) return null;
  const keys = [
    "File Name", "doc_title", "author", "Title", "Heading 1", "Heading 2", "Style", "Body Text",
  ];
  const labels = {
    doc_title: "Document Title", author: "Author",
  };
  return (
    <div className="overflow-x-auto border border-border" data-testid="preview-table">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {keys.map((k) => (
              <th key={k} className="whitespace-nowrap border-r border-white/20 px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.12em] last:border-r-0">
                {labels[k] || k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border odd:bg-surface hover:bg-muted/60" data-testid={`preview-row-${i}`}>
              {keys.map((k) => (
                <td key={k} className="max-w-[320px] truncate border-r border-border px-3 py-2 align-top text-foreground last:border-r-0" title={r[k] || ""}>
                  {k === "Style" ? (
                    <span className="inline-block bg-muted px-2 py-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">{r[k]}</span>
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
