import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  UploadCloud, FileText, X, Loader2, Download, Sparkles, AlertTriangle, CheckCircle2, RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import PreviewTable from "@/components/PreviewTable";

const MAX_FILES = 200;

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

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const f of incoming) {
        if (!existing.has(f.name + f.size)) merged.push(f);
      }
      if (merged.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files. Extra files ignored.`);
        return merged.slice(0, MAX_FILES);
      }
      return merged;
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const reset = () => { setFiles([]); setResult(null); };

  const convert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const { data } = await api.post("/convert", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      if (data.errors?.length) {
        toast.warning(`${data.file_count} converted, ${data.errors.length} skipped`);
      } else {
        toast.success(`Converted ${data.file_count} file(s) · ${data.row_count} rows`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Conversion failed");
    } finally {
      setProcessing(false);
    }
  };

  const download = async () => {
    if (!result?.job_id) return;
    try {
      const res = await api.get(`/jobs/${result.job_id}/download`, { responseType: "blob" });
      downloadBlob(res.data, `word-to-excel-${result.job_id.slice(0, 8)}.xlsx`);
      toast.success("Excel downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  const docxCount = files.filter((f) => f.name.toLowerCase().endsWith(".docx")).length;

  return (
    <Layout>
      <div className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">Batch converter</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
          Word to Excel
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Drop up to {MAX_FILES} WANO Field Note <span className="font-mono text-foreground">.docx</span> files. We extract each
          observation Fact (main and sub-facts), split out Keyword and Area, and pull Title, Scope and the document's Area / Reviewer
          metadata into a single combined spreadsheet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Drop zone */}
        <div className="lg:col-span-3">
          <div
            data-testid="dropzone"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed p-12 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
          >
            <div className="grid h-16 w-16 place-items-center bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="mt-5 font-heading text-lg font-medium text-foreground">
              {dragging ? "Drop here" : "Drag & drop Word files"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">or</p>
            <button
              data-testid="browse-button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 border border-border bg-background px-5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Browse files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".docx"
              className="hidden"
              data-testid="file-input"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <p className="mt-4 text-xs text-muted-foreground">.docx only · max {MAX_FILES} files</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                data-testid="convert-button"
                onClick={convert}
                disabled={processing || docxCount === 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {processing ? "Processing…" : `Convert ${docxCount} file${docxCount === 1 ? "" : "s"}`}
              </button>
              <button
                data-testid="clear-button"
                onClick={reset}
                className="flex h-12 items-center gap-2 border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          )}
        </div>

        {/* File list */}
        <div className="lg:col-span-2">
          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Queue</span>
              <span data-testid="file-count" className="font-mono text-sm text-foreground">{files.length}/{MAX_FILES}</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {files.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">No files yet.</p>
              ) : (
                files.map((f, i) => {
                  const ok = f.name.toLowerCase().endsWith(".docx");
                  return (
                    <div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0" data-testid={`queued-file-${i}`}>
                      <FileText className={`h-4 w-4 shrink-0 ${ok ? "text-primary" : "text-destructive"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground" title={f.name}>{f.name}</p>
                        {!ok && <p className="text-xs text-destructive">Only .docx supported</p>}
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground transition-colors hover:text-destructive" data-testid={`remove-file-${i}`} aria-label="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-12"
          data-testid="result-section"
        >
          <div className="flex flex-col gap-4 border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-tight text-foreground">Conversion complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.file_count} file(s) · {result.row_count} rows extracted
                </p>
              </div>
            </div>
            <button
              data-testid="download-excel-button"
              onClick={download}
              className="flex h-12 items-center justify-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" /> Download Excel
            </button>
          </div>

          {result.errors?.length > 0 && (
            <div className="mt-4 border border-destructive/40 bg-destructive/10 p-4" data-testid="errors-block">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> {result.errors.length} file(s) skipped
              </p>
              <ul className="space-y-1 text-sm text-destructive/90">
                {result.errors.map((e, i) => (
                  <li key={i}><span className="font-mono">{e.filename}</span> — {e.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Preview (first {result.preview.length} rows)
            </p>
            <PreviewTable columns={result.columns} rows={result.preview} />
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
