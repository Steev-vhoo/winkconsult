"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { uploadEditorImage } from "@/app/admin/actions";

export function MarkdownEditor({ name, defaultValue, label, rows = 16, uploads = false }: {
  name: string; defaultValue: string; label: string; rows?: number; uploads?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  async function insertImage(file: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadEditorImage(fd).catch(() => ({ ok: false as const, error: "The image couldn't be uploaded. Please try again." }));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    const alt = file.name.replace(/\.[^.]*$/, "").replace(/[-_]+/g, " ").replace(/[[\]]/g, "");
    const snippet = `\n\n![${alt}](${res.url})\n\n`;
    const el = area.current;
    const at = el ? el.selectionStart : value.length;
    const next = value.slice(0, at) + snippet + value.slice(at);
    setValue(next);
    setPreview(false);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = at + snippet.length;
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
        <label htmlFor={name}>{label}</label>
        <div className="editor-tabs">
          {uploads && (
            <>
              <button type="button" onClick={() => picker.current?.click()} disabled={busy}>{busy ? "Uploading…" : "Insert image"}</button>
              <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) insertImage(f); }} />
            </>
          )}
          <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
        </div>
      </div>
      {error && <div className="flash err" role="alert" style={{ margin: "0 0 8px" }}>{error}</div>}
      <textarea ref={area} id={name} name={name} className="code" rows={rows} value={value} onChange={(e) => setValue(e.target.value)} hidden={preview} />
      {preview && <div className="preview"><ReactMarkdown skipHtml>{value || "_Nothing to preview yet._"}</ReactMarkdown></div>}
      <p className="hint">
        Formatting: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>[link text](https://…)</code>.
      </p>
    </div>
  );
}
