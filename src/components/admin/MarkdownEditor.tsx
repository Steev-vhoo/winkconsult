"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export function MarkdownEditor({ name, defaultValue, label, rows = 16 }: { name: string; defaultValue: string; label: string; rows?: number }) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
        <label htmlFor={name}>{label}</label>
        <div className="editor-tabs">
          <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
        </div>
      </div>
      <textarea id={name} name={name} className="code" rows={rows} value={value} onChange={(e) => setValue(e.target.value)} hidden={preview} />
      {preview && <div className="preview"><ReactMarkdown skipHtml>{value || "_Nothing to preview yet._"}</ReactMarkdown></div>}
      <p className="hint">
        Formatting: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>[link text](https://…)</code>.
      </p>
    </div>
  );
}
