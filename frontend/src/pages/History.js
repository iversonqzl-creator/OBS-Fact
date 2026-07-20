import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, Trash2, FileText, Clock, AlertTriangle, Inbox, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";

function downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function History() {
  const [jobs, setJobs] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/jobs");
      setJobs(data);
    } catch {
      setJobs([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const download = async (id) => {
    try {
      const res = await api.get(`/jobs/${id}/download`, { responseType: "blob" });
      downloadBlob(res.data, `word-to-excel-${id.slice(0, 8)}.xlsx`);
      toast.success("Excel downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.job_id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <Link to="/word-to-excel" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="history-back">
        <ArrowLeft className="h-4 w-4" /> Word → Excel
      </Link>
      <div className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">Past conversions</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">History</h1>
      </div>

      {jobs === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="grid place-items-center border border-dashed border-border bg-surface py-20 text-center" data-testid="history-empty">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-foreground">No conversions yet.</p>
          <p className="text-sm text-muted-foreground">Convert some Word files to see them here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border" data-testid="history-list">
          {jobs.map((j) => (
            <div key={j.job_id} className="flex flex-col gap-4 bg-surface p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between" data-testid={`history-item-${j.job_id}`}>
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{j.file_count} file(s) · {j.row_count} rows</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {new Date(j.created_at).toLocaleString()}
                  </p>
                  {j.errors?.length > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {j.errors.length} skipped
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid={`download-${j.job_id}`}
                  onClick={() => download(j.job_id)}
                  className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" /> Excel
                </button>
                <button
                  data-testid={`delete-${j.job_id}`}
                  onClick={() => remove(j.job_id)}
                  className="grid h-10 w-10 place-items-center border border-border bg-background text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
