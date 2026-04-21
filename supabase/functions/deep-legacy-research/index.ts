import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!perplexityKey) return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!anthropicKey) return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { surname, country, interviewAnswers } = await req.json();
  if (!surname) return new Response(JSON.stringify({ error: "Missing surname" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const originCountry = country || "unknown origin";
  const queries = [
    `${surname} surname origin meaning etymology history England`,
    `${surname} family historical records ancestors genealogy`,
    `${surname} family migration Newfoundland Canada ${originCountry}`,
  ];
  if (interviewAnswers?.homeRegion) queries.push(`${surname} family ${interviewAnswers.homeRegion} historical ancestry`);

  try {
    const seenUrls = new Set<string>();
    const allSnippets: string[] = [];
    const allSources: { title: string; url: string }[] = [];

    for (const query of queries.slice(0, 3)) {
      const res = await fetch("https://api.perplexity.ai/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${perplexityKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_results: 4, max_tokens_per_page: 1500, search_domain_filter: ["houseofnames.com","familysearch.org","forebears.io","wikitree.com","wikipedia.org","ancestry.com"] }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of (data.results || [])) {
        if (!seenUrls.has(r.url) && r.snippet?.length > 100) {
          seenUrls.add(r.url);
          allSnippets.push(`Source: ${r.title}\n${r.snippet}`);
          allSources.push({ title: r.title, url: r.url });
        }
      }
    }

    const rawResearch = allSnippets.slice(0, 8).join("\n\n---\n\n");

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: `You are a family historian writing for AncestorsQR. Based on the research below about the ${surname} surname from ${originCountry}, write a rich, emotional, well-structured historical summary in 4-5 paragraphs.\n\nWrite in warm, cinematic prose. Focus on: the origin and meaning of the name, where the family came from and their occupation/status, key historical figures, migration patterns, and what makes this surname's legacy remarkable.\n\nDo NOT use bullet points or headers. Write flowing paragraphs. Focus on the historical bloodline.\n\nRESEARCH:\n${rawResearch}` }],
      }),
    });

    let researchSummary = rawResearch;
    if (claudeRes.ok) {
      const claudeData = await claudeRes.json();
      researchSummary = claudeData.content?.[0]?.text || rawResearch;
    }

    const uniqueSources = allSources.filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i).slice(0, 6);

    return new Response(JSON.stringify({ success: true, surname, country: originCountry, researchSummary, sources: uniqueSources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
