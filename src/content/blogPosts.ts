export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string; // ISO
  readMinutes: number;
  /** HTML body. Use only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <a>. */
  bodyHtml: string;
  cta: {
    label: string;
    href: string;
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "what-does-my-last-name-mean",
    title: "What Does My Last Name Mean? A Free Guide to Surname Origins",
    metaTitle: "What Does My Last Name Mean? Free Surname Origin Guide",
    metaDescription:
      "Wondering what your last name means? Learn how surnames were born, the 4 origin types, and how to trace yours back through the centuries — free guide.",
    excerpt:
      "Your surname is the oldest word you own. Here is how to decode where it came from, what it meant, and what your ancestors did before it became yours.",
    publishedAt: "2026-05-26",
    readMinutes: 7,
    bodyHtml: `
<p>Most people carry their last name for a lifetime and never ask the obvious question: <em>what does it actually mean?</em> Surnames are the oldest word most of us own. They were given to our ancestors for a reason — a trade, a village, a father, a feature — and that reason is usually still hiding in the letters.</p>

<h2>Where surnames came from</h2>
<p>For most of human history, people didn't have last names at all. A single given name was enough. As villages grew into towns and towns into kingdoms, "John" was no longer specific enough. Somewhere between the 11th and 15th centuries, depending on the region, second names began to stick — first as descriptions, then as inheritance.</p>
<p>By the time parish records started in earnest, your surname was no longer a description of <em>you</em>. It was a description of an ancestor you may never have met, carried forward through your bloodline like a torch.</p>

<h2>The four origins of nearly every surname</h2>
<p>Almost every European-rooted last name falls into one of four buckets. Once you know which bucket yours sits in, you can usually guess what your ancestor did, looked like, or lived near.</p>

<h3>1. Occupational surnames</h3>
<p>These are the easiest to spot. <strong>Smith</strong> forged metal. <strong>Baker</strong> baked. <strong>Fletcher</strong> made arrows. <strong>Hayward</strong> guarded the village hedge and managed common land. Whatever your ancestor did with their hands, the village remembered.</p>

<h3>2. Patronymic surnames</h3>
<p>"Son of" names. <strong>Johnson</strong> meant John's son. <strong>O'Brien</strong> meant descendant of Brien. <strong>MacDonald</strong>, <strong>Fitzgerald</strong>, <strong>Andersen</strong>, <strong>Ivanov</strong> — every culture has its own grammar for the same idea: your father mattered, so we named you after him.</p>

<h3>3. Locational surnames</h3>
<p>Names that point to a place. <strong>Hill</strong>, <strong>Brooks</strong>, <strong>Lancaster</strong>, <strong>Lincoln</strong>, <strong>Wood</strong>. Your ancestor either lived next to that feature, or moved away from it and was identified by the place they left behind.</p>

<h3>4. Descriptive (nickname) surnames</h3>
<p>The medieval equivalent of a nickname that never wore off. <strong>Short</strong>, <strong>Long</strong>, <strong>Brown</strong>, <strong>Armstrong</strong>, <strong>Reid</strong> (red-haired). Somewhere in your bloodline, a single ancestor was vivid enough that the village named the whole family after him.</p>

<h2>Why your name probably changed</h2>
<p>The spelling you carry today is rarely the original. Surnames mutated as they moved — Anglicised at borders, simplified by clerks who couldn't spell them, shortened at Ellis Island, softened to fit a new tongue. <strong>Müller</strong> became <strong>Miller</strong>. <strong>Schmidt</strong> became <strong>Smith</strong>. <strong>Kowalski</strong> became <strong>Kowal</strong>. The meaning usually survives the spelling.</p>

<h2>How to trace yours back</h2>
<ol>
  <li><strong>Start with the meaning.</strong> Look up your surname's origin, language family, and earliest recorded use. This anchors everything that comes next.</li>
  <li><strong>Find the region.</strong> Most surnames cluster geographically. Knowing where yours was most common in 1700 tells you where to dig.</li>
  <li><strong>Walk the records backward.</strong> Census → parish registers → wills. Each layer reveals one more generation.</li>
  <li><strong>Watch for the spelling drift.</strong> A name that looks unrelated today might be your direct ancestor under an older spelling.</li>
</ol>

<h2>The shortcut</h2>
<p>You can do all of this by hand, in libraries, over years. Or you can start with the meaning today, for free, and decide how deep you want to go from there.</p>
`,
    cta: {
      label: "Look up my surname free",
      href: "/tools/surname",
    },
  },
  {
    slug: "how-to-create-a-family-coat-of-arms",
    title: "How to Create a Family Coat of Arms (and What Each Symbol Means)",
    metaTitle: "How to Create a Family Coat of Arms — Symbols, Colors & Meaning",
    metaDescription:
      "Design a meaningful family coat of arms. Learn what the colors, animals, and symbols traditionally meant, and how to build a crest your family will keep.",
    excerpt:
      "A coat of arms isn't decoration. It is a sentence written in colour and symbol. Here is how to compose one your bloodline will actually remember.",
    publishedAt: "2026-05-26",
    readMinutes: 8,
    bodyHtml: `
<p>A family coat of arms is a sentence written in colour and symbol. Done well, it says — in a single glance — who your family is, what they value, and what they have survived. Done badly, it's a clip-art shield with a lion glued to it.</p>
<p>The good news: the rules that governed heraldry for 800 years are not secret. They're just forgotten. Here is how to compose a crest that will actually mean something to the people who inherit it.</p>

<h2>Start with the shield (the field)</h2>
<p>The shield itself — called the <em>field</em> — is the foundation. Its colour comes first because every other choice has to live on top of it. Traditional heraldry used only seven colours, and each one carried meaning:</p>
<ul>
  <li><strong>Gold (Or)</strong> — generosity, elevation of mind</li>
  <li><strong>Silver (Argent)</strong> — peace, sincerity</li>
  <li><strong>Red (Gules)</strong> — warrior, martyr, courage</li>
  <li><strong>Blue (Azure)</strong> — truth, loyalty</li>
  <li><strong>Green (Vert)</strong> — hope, joy, loyalty in love</li>
  <li><strong>Black (Sable)</strong> — constancy, grief</li>
  <li><strong>Purple (Purpure)</strong> — royalty, justice, sovereignty</li>
</ul>
<p>Pick the one that describes the spine of your family, not the surface.</p>

<h2>Choose your charge (the central symbol)</h2>
<p>The <em>charge</em> is whatever sits on the shield. This is where families say what they are.</p>
<ul>
  <li><strong>Lion</strong> — courage, royalty, the head of the household</li>
  <li><strong>Eagle</strong> — leadership, far-sightedness, command</li>
  <li><strong>Wolf</strong> — loyalty, perseverance, the long memory</li>
  <li><strong>Stag</strong> — peace and harmony, but a will to defend</li>
  <li><strong>Bear</strong> — protection, strength of the elder</li>
  <li><strong>Oak tree</strong> — antiquity, strength rooted in place</li>
  <li><strong>Tower or castle</strong> — safety, fortress, the home as refuge</li>
  <li><strong>Sword</strong> — justice, military honour</li>
  <li><strong>Anchor</strong> — hope, the sea, steadfastness</li>
  <li><strong>Sun</strong> — glory, splendour, the dawn of a House</li>
</ul>

<h2>Add the motto</h2>
<p>Every great coat of arms ends in a motto — a single line, usually in Latin, that compresses the family's whole philosophy into a few syllables. The motto is what your grandchildren will quote at funerals and at weddings, long after the rest of the design has faded.</p>
<p>A good motto:</p>
<ul>
  <li>Is short. Three to five words is the sweet spot.</li>
  <li>Says something you would actually want to be remembered for.</li>
  <li>Works in your language as well as Latin.</li>
</ul>
<p>Example: <em>Ex Labore, Ascendimus</em> — "From Labour, We Rise." Earned by hands. True for generations.</p>

<h2>What to leave out</h2>
<p>The most common mistake is overcrowding. A traditional shield carries one or two charges and one motto. That's it. If your crest needs a paragraph to explain it, it's no longer a crest — it's a logo.</p>
<p>Restraint is the entire art form. The medieval herald who designed your great-great-grandfather's shield was not trying to fit everything in. He was trying to leave a mark that could be recognised from across a battlefield, in one second, by people who could not read.</p>

<h2>From idea to keepsake</h2>
<p>Once you've chosen your colours, charges, and motto, the final step is rendering it cleanly — clean lines, traditional proportions, no Comic Sans, no clip art. A coat of arms is something a family hangs on a wall for fifty years. Treat it like that from the first sketch.</p>
`,
    cta: {
      label: "Forge my family crest free",
      href: "/journey/1",
    },
  },
  {
    slug: "ellis-island-name-change",
    title: "Why Was My Family Name Changed at Ellis Island? (The Truth)",
    metaTitle: "Was My Family Name Changed at Ellis Island? The Truth",
    metaDescription:
      "The Ellis Island name change story is mostly a myth. Here is what actually happened to your family's last name when they immigrated — and how to find the original.",
    excerpt:
      "Almost every American family tells the same story: an officer at Ellis Island shortened the name. The truth is more interesting — and more recoverable.",
    publishedAt: "2026-05-26",
    readMinutes: 6,
    bodyHtml: `
<p>If your family came through Ellis Island, you have probably heard the same story your friends have heard: an officer at the inspection desk took one look at the surname, decided it was unpronounceable, and changed it on the spot. <strong>Konopka</strong> became <strong>Cooper</strong>. <strong>Schwartzbaum</strong> became <strong>Black</strong>. <strong>Lapinski</strong> became <strong>Lapin</strong>.</p>
<p>It's a great story. It is also, almost entirely, a myth.</p>

<h2>What actually happened at Ellis Island</h2>
<p>Inspectors at Ellis Island didn't write names. They <em>read</em> them — from passenger manifests that had been filled out at the port of departure, in the language of the home country, by clerks who knew exactly how to spell what they were hearing. By the time your ancestor reached the desk in New York, the name was already on paper.</p>
<p>Most inspectors were also immigrants themselves, fluent in multiple European languages. The image of a confused American officer butchering Polish or Yiddish surnames doesn't hold up against the actual hiring records.</p>

<h2>So why did so many names change?</h2>
<p>Because they did change. Just not at Ellis Island. Your family changed the name themselves, usually for one of four reasons:</p>

<h3>1. To be hired</h3>
<p>An obviously foreign surname could cost you a job in 1910 New York. Many immigrants Anglicised their own name within their first few years to compete in the labour market. <strong>Müller</strong> became <strong>Miller</strong> on the second job application, not the first day off the boat.</p>

<h3>2. To be understood</h3>
<p>Spelling drift. American clerks, bosses, and schoolteachers wrote down what they heard. After enough years of being mispronounced, families simply adopted the spelling that everyone already used.</p>

<h3>3. To fit in</h3>
<p>Especially in the second generation. Children of immigrants often shortened or translated their parents' names to feel less marked. <strong>Cohen</strong>, <strong>Cone</strong>, and <strong>Kane</strong> can all share the same root.</p>

<h3>4. To survive prejudice</h3>
<p>Anti-German sentiment during both World Wars, antisemitism through most of the 20th century, anti-Italian and anti-Slavic discrimination — all produced waves of voluntary name changes that had nothing to do with any immigration officer.</p>

<h2>How to find the original name</h2>
<p>The good news: because the name on the manifest is the <em>original</em> name, the record almost always still exists. Here is the order to work in:</p>
<ol>
  <li><strong>Find the manifest.</strong> Ellis Island arrival records are searchable, free, and digitised. Search by the Americanised name first — manifests are cross-referenced.</li>
  <li><strong>Compare spellings.</strong> The manifest name is your starting truth. Note the home country, port of departure, and date.</li>
  <li><strong>Walk it back to the village.</strong> European parish and civil registers usually pre-date the change by centuries.</li>
  <li><strong>Decode the meaning.</strong> Once you have the original spelling, the surname's origin and meaning are usually recoverable in minutes, not years.</li>
</ol>

<h2>Why this matters</h2>
<p>The Ellis Island story is comforting because it makes the loss feel accidental — a clerk's mistake, no one's fault. The truth is harder and better. Your family <em>chose</em> the change, usually under pressure, usually to give the next generation a chance. That decision is part of your inheritance too.</p>
<p>Finding the original name doesn't undo the change. It just gives you back the sentence that came before it.</p>
`,
    cta: {
      label: "Discover your surname's origin free",
      href: "/tools/surname",
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
