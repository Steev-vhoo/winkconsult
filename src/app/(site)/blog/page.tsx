import type { Metadata } from "next";
import { PageHero } from "@/components/site/CtaBand";
import { PostCard } from "@/components/site/PostCard";
import { listPublishedPosts } from "@/lib/content";

export const revalidate = 300;
export const metadata: Metadata = { title: "Updates", description: "News and tips for Ghanaian nurses and midwives working towards practising abroad." };

export default async function Blog() {
  const posts = await listPublishedPosts();
  return (
    <>
      <PageHero eyebrow="Updates" title="News & tips" lead="Fee changes, exam dates and practical advice for your journey abroad." />
      <section className="section">
        <div className="container">
          {posts.length ? (
            <div className="post-list">{posts.map((p, i) => <PostCard key={p.id} post={p} i={i} />)}</div>
          ) : (
            <p className="empty">No updates yet. Check back soon, or join our WhatsApp group for the latest news.</p>
          )}
        </div>
      </section>
    </>
  );
}
