import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { CtaBand } from "@/components/site/CtaBand";
import { fmtDate, getPublishedPost } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, images: post.cover_url ? [post.cover_url] : undefined } };
}

export default async function PostPage({ params }: Props) {
  const [post, s] = await Promise.all([getPublishedPost((await params).slug), getSettings()]);
  if (!post) notFound();
  return (
    <>
      <section className="page-hero">
        <div className="container article">
          <Link className="eyebrow" href="/blog" style={{ textDecoration: "none" }}>← All updates</Link>
          <h1>{post.title}</h1>
          <p className="article-meta">{fmtDate(post.published_at, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </section>
      <section className="section">
        <div className="container article">
          {post.cover_url && <img src={post.cover_url} alt="" style={{ width: "100%", borderRadius: 16, marginBottom: 28 }} />}
          <Markdown>{post.body_md}</Markdown>
        </div>
      </section>
      <CtaBand settings={s} />
    </>
  );
}
