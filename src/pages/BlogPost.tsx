import { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getBlogPost } from "@/content/blogPosts";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = getBlogPost(slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  usePageMeta({
    title: post.metaTitle,
    description: post.metaDescription,
    type: "article",
    url: `https://ancestorsqr.com/blog/${post.slug}`,
  });

  // Inject Article JSON-LD for this post
  useEffect(() => {
    const id = "blog-post-jsonld";
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { "@type": "Organization", name: "AncestorsQR" },
      publisher: {
        "@type": "Organization",
        name: "AncestorsQR",
        logo: {
          "@type": "ImageObject",
          url: "https://ancestorsqr.com/og-default.jpg",
        },
      },
      mainEntityOfPage: `https://ancestorsqr.com/blog/${post.slug}`,
      image: "https://ancestorsqr.com/og-default.jpg",
    });
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [post]);

  return (
    <div style={{ background: "#0d0a07", minHeight: "100vh" }}>
      <article className="mx-auto max-w-3xl px-6 pt-24 pb-32 sm:px-8">
        <div className="mb-8">
          <Link
            to="/blog"
            className="font-sans uppercase"
            style={{
              fontSize: "11px",
              letterSpacing: "2.5px",
              color: "#a07830",
              textDecoration: "none",
            }}
          >
            ← The Ancestra Journal
          </Link>
        </div>

        <p
          className="font-sans uppercase"
          style={{ fontSize: "10px", letterSpacing: "4px", color: "#a07830" }}
        >
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · {post.readMinutes} min read
        </p>

        <h1
          className="mt-6"
          style={{
            fontFamily: "'Libre Caslon Display', serif",
            color: "#f0e8da",
            fontSize: "clamp(34px, 5.5vw, 56px)",
            lineHeight: 1.12,
          }}
        >
          {post.title}
        </h1>

        <div
          className="prose-fireside mt-12"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#d0c4b4",
            fontSize: "17px",
            lineHeight: 1.8,
          }}
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />

        <div
          className="mt-16 text-center"
          style={{
            background: "#1a1510",
            border: "1px solid #3d3020",
            borderRadius: "22px",
            padding: "40px 28px",
          }}
        >
          <p
            className="font-sans uppercase"
            style={{ fontSize: "10px", letterSpacing: "4px", color: "#a07830" }}
          >
            Begin Your Legacy
          </p>
          <p
            className="mx-auto mt-4 max-w-md"
            style={{
              fontFamily: "'Libre Caslon Text', serif",
              fontStyle: "italic",
              color: "#e8ddd0",
              fontSize: "20px",
              lineHeight: 1.5,
            }}
          >
            Who in your family needs to see this?
          </p>
          <Link
            to={post.cta.href}
            className="mt-8 inline-block font-sans font-semibold uppercase"
            style={{
              background: "linear-gradient(135deg, #e8943a, #c47828)",
              color: "#1a1208",
              fontSize: "13px",
              letterSpacing: "1.5px",
              padding: "16px 40px",
              borderRadius: "60px",
              textDecoration: "none",
            }}
          >
            {post.cta.label}
          </Link>
        </div>
      </article>

      <style>{`
        .prose-fireside h2 {
          font-family: 'Libre Caslon Display', serif;
          color: #e8ddd0;
          font-size: clamp(24px, 3vw, 30px);
          line-height: 1.25;
          margin-top: 56px;
          margin-bottom: 16px;
        }
        .prose-fireside h3 {
          font-family: 'Libre Caslon Display', serif;
          color: #d4a04a;
          font-size: clamp(19px, 2.4vw, 22px);
          line-height: 1.3;
          margin-top: 36px;
          margin-bottom: 12px;
        }
        .prose-fireside p { margin-bottom: 20px; color: #d0c4b4; }
        .prose-fireside ul, .prose-fireside ol { margin: 20px 0 24px 24px; }
        .prose-fireside li { margin-bottom: 10px; color: #d0c4b4; }
        .prose-fireside strong { color: #e8ddd0; font-weight: 600; }
        .prose-fireside em { color: #d4a04a; font-style: italic; font-family: 'Libre Caslon Text', serif; }
        .prose-fireside a { color: #d4a04a; text-decoration: underline; text-underline-offset: 3px; }
        .prose-fireside blockquote {
          border-left: 2px solid #d4a04a;
          padding-left: 20px;
          margin: 28px 0;
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          color: #e8ddd0;
        }
      `}</style>
    </div>
  );
};

export default BlogPost;
