import Link from "next/link";
import ReactMarkdown from "react-markdown";

/** Safe Markdown: raw HTML in the source is not rendered. */
export function Markdown({ children, className = "prose" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            ),
          img: ({ src, alt }) => (typeof src === "string" ? <img src={src} alt={alt ?? ""} loading="lazy" style={{ maxWidth: "100%", borderRadius: 12 }} /> : null),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
