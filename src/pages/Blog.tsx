import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import { blogPosts } from "@/content/blogPosts";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const Blog = () => {
  usePageMeta({
    title: "The Ancestra Journal — Surnames, Crests & Family History",
    description:
      "Free guides on surname origins, family coats of arms, ancestry myths, and how to trace your bloodline. Plain-English articles from AncestorsQR.",
  });

  const sorted = [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <div style={{ background: "#0d0a07", minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-32 sm:px-8">
        <p
          className="text-center font-sans font-semibold uppercase"
          style={{ fontSize: "10px", letterSpacing: "4px", color: "#a07830" }}
        >
          The Ancestra Journal
        </p>

        <h1
          className="mt-6 text-center"
          style={{
            fontFamily: "'Libre Caslon Display', serif",
            color: "#f0e8da",
            fontSize: "clamp(36px, 6vw, 64px)",
            lineHeight: 1.1,
          }}
        >
          Every name has a story.
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-center"
          style={{
            fontFamily: "'Libre Caslon Text', serif",
            fontStyle: "italic",
            color: "#d0c4b4",
            fontSize: "18px",
            lineHeight: 1.6,
          }}
        >
          Free guides on surnames, coats of arms, immigration, and the small clues that lead back to a family you almost forgot.
        </p>

        <div className="mt-20 space-y-10">
          {sorted.map((post) => (
            <motion.article
              key={post.slug}
              {...reveal}
              style={{
                background: "#1a1510",
                border: "1px solid #2a2018",
                borderRadius: "22px",
                padding: "36px",
              }}
            >
              <p
                className="font-sans uppercase"
                style={{ fontSize: "10px", letterSpacing: "3px", color: "#a07830" }}
              >
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {post.readMinutes} min read
              </p>
              <h2
                className="mt-4"
                style={{
                  fontFamily: "'Libre Caslon Display', serif",
                  color: "#e8ddd0",
                  fontSize: "clamp(24px, 3.5vw, 34px)",
                  lineHeight: 1.2,
                }}
              >
                <Link to={`/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h2>
              <p
                className="mt-4"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#c4b8a6",
                  fontSize: "16px",
                  lineHeight: 1.7,
                }}
              >
                {post.excerpt}
              </p>
              <div className="mt-6">
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-block font-sans font-semibold uppercase"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "1.5px",
                    color: "#d4a04a",
                    textDecoration: "none",
                  }}
                >
                  Read the story →
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
