import Link from "next/link";
import { fmtDate } from "@/lib/content";

export function PostCard({ post, i }: { post: { slug: string; title: string; excerpt: string; cover_url: string | null; published_at: Date | null }; i: number }) {
  return (
    <Link className="guide" href={`/blog/${post.slug}`}>
      {post.cover_url ? (
        <img className="post-cover" src={post.cover_url} alt="" loading="lazy" />
      ) : (
        <div className={`guide-top g${(i % 3) + 1}`}><span className="badge">{fmtDate(post.published_at)}</span></div>
      )}
      <div className="guide-body">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <span className="arrow-link">Read more →</span>
      </div>
    </Link>
  );
}
