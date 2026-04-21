import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { surname, country, interviewAnswers } = await req.json();

  if (!surname) {
    return new Response(JSON.stringify({ error: "Missing required field: surname" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const originCountry = country || "unknown origin";

  const queries = [
    `${surname} surname history origin meaning ${originCountry}`,
    `${surname} family history genealogy ancestors historical records`,
    `${surname} family migration patterns historical ${originCountry} settlement`,
  ];

  if (interviewAnswers?.knownAncestors) {
    queries.push(`${interviewAnswers.knownAncestors} ${surname} family history genealogy`);
  }
  if (interviewAnswers?.homeRegion) {
    queries.push(`${surname} family ${interviewAnswers.homeRegion} historical records ancestry`);
  }

  try {
    const allResults: Record<string, unknown>[] = [];

    for (const query of queries.slice(0, 4)) {
      const res = await fetch("https://api.perplexity.ai/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          max_results: 5,
          max_tokens_per_page: 2048,
          search_domain_filter: [
            "ancestry.com","familysearch.org","findmypast.com",
            "myheritage.com","wikitree.com","geni.com",
            "forebears.io","houseofnames.com","wikipedia.org",
          ],
        }),
      });

      if (!res.ok) { continue; }
      const data = await res.json();
      if (data.results?.length) {
        allResults.push({ query, results: data.results.map((r: Record<string, unknown>) => ({ title: r.title, url: r.url, snippet: r.snippet })) });
      }
    }

    const researchSummary = allResults.map((group: Record<string, unknown>) => {
      const results = group.results as Record<string, unknown>[];
      return `## Query: ${group.query}\n${results.map((r) => `- **${r.title}** (${r.url})\n  ${r.snippet}`).join("\n")}`;
    }).join("\n\n");

    return new Response(JSON.stringify({ success: true, surname, country: originCountry, researchSummary, sources: allResults.flatMap((g: Record<string, unknown>) => (g.results as Record<string, unknown>[]).map((r) => ({ title: r.title, url: r.url }))) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
