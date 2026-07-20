import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  UploadCloud, FileText, X, Loader2, Download, FilePlus2, RotateCcw, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";

const MAX_FILES = 100;
const REVEAL = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

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

export default function WordToPdf() {
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
      for (const f of incoming) if (!existing.has(f.name + f.size)) merged.push(f);
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

  const docxCount = files.filter((f) => f.name.toLowerCase().endsWith(".docx")).length;

  const convert = async () => {
    if (!files.length) return;
    setProcessing(true);
    setResult(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await api.post("/word-to-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });
      const converted = res.headers["x-converted-count"] || "?";
      const errCount = Number(res.headers["x-error-count"] || 0);
      downloadBlob(res.data, "combined.pdf");
      setResult({ converted, errCount });
      if (errCount > 0) toast.warning(`${converted} converted, ${errCount} skipped`);
      else toast.success(`Combined ${converted} file(s) into one PDF`);
    } catch (err) {
      let msg = "Conversion failed";
      if (err.response?.data instanceof Blob) {
        try { msg = JSON.parse(await err.response.data.text()).detail || msg; } catch { /* noop */ }
      }
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="back-to-modules">
        <ArrowLeft className="h-4 w-4" /> Modules
      </Link>
      <div className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">Merge tool</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
          Word → PDF (Combine)
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Upload up to {MAX_FILES} <span className="font-mono text-foreground">.docx</span> files. Each is converted to PDF and merged,
          in upload order, into a single combined PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div
            data-testid="pdf-dropzone"
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
              data-testid="pdf-browse-button"
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
              data-testid="pdf-file-input"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <p className="mt-4 text-xs text-muted-foreground">.docx only · max {MAX_FILES} files</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                data-testid="pdf-convert-button"
                onClick={convert}
                disabled={processing || docxCount === 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
                {processing ? "Converting…" : `Combine ${docxCount} file${docxCount === 1 ? "" : "s"} → PDF`}
              </button>
              <button
                data-testid="pdf-clear-button"
                onClick={reset}
                className="flex h-12 items-center gap-2 border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Queue</span>
              <span data-testid="pdf-file-count" className="font-mono text-sm text-foreground">{files.length}/{MAX_FILES}</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {files.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">No files yet.</p>
              ) : (
                files.map((f, i) => {
                  const ok = f.name.toLowerCase().endsWith(".docx");
                  return (
                    <div key={`${f.name}-${f.size}`} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0" data-testid={`pdf-queued-file-${i}`}>
                      <FileText className={`h-4 w-4 shrink-0 ${ok ? "text-primary" : "text-destructive"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground" title={f.name}>{f.name}</p>
                        {!ok && <p className="text-xs text-destructive">Only .docx supported</p>}
                      </div>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground transition-colors hover:text-destructive" data-testid={`pdf-remove-file-${i}`} aria-label="Remove">
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

      {result && (
        <motion.div {...REVEAL} className="mt-10 flex items-center gap-4 border border-border bg-surface p-6" data-testid="pdf-result">
          <div className="grid h-12 w-12 place-items-center bg-primary/10 text-primary">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight text-foreground">Combined PDF downloaded</p>
            <p className="text-sm text-muted-foreground">{result.converted} file(s) merged{result.errCount > 0 ? ` · ${result.errCount} skipped` : ""}.</p>
          </div>
          {result.errCount > 0 && <AlertTriangle className="ml-auto h-5 w-5 text-destructive" />}
        </motion.div>
      )}
    </Layout>
  );
}
