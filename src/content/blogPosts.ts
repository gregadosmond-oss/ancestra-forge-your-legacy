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
  {
    slug: "how-to-build-a-family-tree",
    title: "How to Build a Family Tree (Free, Step-by-Step for Beginners)",
    metaTitle: "How to Build a Family Tree — Free Beginner's Guide",
    metaDescription:
      "Start your family tree today. A simple, step-by-step guide for beginners — what to collect, where to find records, and how to grow it five generations deep.",
    excerpt:
      "You don't need a subscription or a genealogist to start. Here is the simplest path from a blank page to a five-generation family tree you can actually trust.",
    publishedAt: "2026-05-26",
    readMinutes: 8,
    bodyHtml: `
<p>Most people put off building a family tree because it sounds like a years-long project. It isn't. The first three generations usually take an afternoon. Everything after that is just patient detective work, one ancestor at a time.</p>
<p>Here is the simplest path from a blank page to a real, sourced family tree — without paying for anything you don't have to.</p>

<h2>Step 1: Start with yourself, not your ancestors</h2>
<p>Every solid tree is built from the present backwards. Write down your own full name, date of birth, and place of birth. Then your parents. Then your grandparents. Don't skip ahead. Don't guess. If you don't know a date, leave it blank — a blank is honest, a guess is a future error.</p>

<h2>Step 2: Interview the oldest person in your family</h2>
<p>This is the single highest-leverage move in genealogy. Call your oldest living relative this week. Ask them:</p>
<ul>
  <li>Full names of their parents and grandparents, including maiden names</li>
  <li>Where each was born and where they died</li>
  <li>What they did for a living</li>
  <li>Where the family came from before that</li>
  <li>Any photos, letters, or documents stored in a drawer somewhere</li>
</ul>
<p>Record the conversation if they'll let you. Memories don't get younger.</p>

<h2>Step 3: Collect the paper you already own</h2>
<p>Before searching any database, raid your own house. Birth certificates, marriage licences, old passports, military discharge papers, the back of framed photos. Most families already own three generations of evidence — it's just scattered.</p>

<h2>Step 4: Use free public records</h2>
<p>You do not need a paid subscription to get started. The biggest free sources:</p>
<ul>
  <li><strong>FamilySearch</strong> — the largest free genealogy database in the world, run by a non-profit. Billions of records, no paywall.</li>
  <li><strong>National Archives</strong> — every country with a working civil service keeps census, military, and immigration records public.</li>
  <li><strong>Find a Grave</strong> — free, volunteer-maintained, surprisingly accurate for dates and family links.</li>
  <li><strong>Local parish and church registers</strong> — for anything pre-1850, this is where the trail usually lives.</li>
</ul>

<h2>Step 5: Walk it back, one generation at a time</h2>
<p>The rhythm is always the same: confirm a person's parents, then treat each parent as a new problem. Use at least two independent sources before you write a name in ink. Census + birth record. Marriage register + headstone. Two records that agree on a date are a fact. One record is a clue.</p>

<h2>Step 6: Watch for the four classic mistakes</h2>
<ol>
  <li><strong>Copying someone else's tree without checking.</strong> Public trees on big sites are riddled with errors. Use them as leads, never as proof.</li>
  <li><strong>Assuming spellings stayed constant.</strong> Your great-grandfather's surname may appear five different ways in five records. They are usually the same man.</li>
  <li><strong>Confusing two people with the same name.</strong> Common in small villages where naming a son after the father was tradition. Always cross-check dates and locations.</li>
  <li><strong>Ignoring the women.</strong> Maiden names are the bridge to a whole other half of your tree. Lose them and you lose 50% of your ancestry every generation.</li>
</ol>

<h2>Step 7: Decide how deep you want to go</h2>
<p>Five generations is the natural sweet spot. That's roughly 62 direct ancestors and takes most people back to the early 1800s. Beyond that, the records thin out and the work doubles per generation. Most families find five generations is enough to feel the shape of their bloodline.</p>

<h2>The shortcut for impatient people</h2>
<p>If the research itself sounds like more work than you want, start with your surname. The meaning, origin, and historical role of your last name will tell you in minutes what a paper trail would take months to reveal — and it's a much better starting point than a blank chart.</p>
`,
    cta: {
      label: "Start with my surname free",
      href: "/tools/surname",
    },
  },
  {
    slug: "what-is-my-family-crest",
    title: "What Is My Family Crest? How to Find (or Forge) Yours",
    metaTitle: "What Is My Family Crest? How to Find or Create Yours",
    metaDescription:
      "Does your family have a coat of arms? Learn how family crests work, how to find a historical one tied to your surname, and how to design your own.",
    excerpt:
      "Almost everyone asking this question expects a yes-or-no answer. The truth is more interesting — and more in your hands than you think.",
    publishedAt: "2026-05-26",
    readMinutes: 6,
    bodyHtml: `
<p>"What is my family crest?" is one of the most-Googled genealogy questions in the world. People expect a simple answer — either their family has one or it doesn't. The truth is more interesting, and the answer is more in your hands than you think.</p>

<h2>The short version</h2>
<p>Coats of arms were never granted to surnames. They were granted to <em>individuals</em>, usually a single ancestor centuries ago, and then inherited down a specific male line. That means two strangers with the same last name today may have entirely different heraldic histories — or none at all.</p>
<p>So when a souvenir shop sells you "the official Murphy crest," that's marketing. Heraldically, there is no such thing.</p>

<h2>How crests actually worked</h2>
<p>In medieval Europe, a knight needed to be recognisable on a battlefield while wearing a full helmet. A unique painted shield solved that problem. Heraldic authorities — the College of Arms in England, the Court of the Lord Lyon in Scotland, equivalents across the continent — recorded each design so no two knights would carry the same one.</p>
<p>That registered design passed, intact, to the eldest son. Younger sons received <em>differenced</em> versions (small variations) so they could be told apart. Daughters' families used different rules again. Over centuries, a single original coat of arms produced dozens of related variants — all legitimate, all distinct.</p>

<h2>Does my family have an inherited coat of arms?</h2>
<p>There are really only three ways to know:</p>
<ol>
  <li><strong>You can trace your direct male line to a documented armiger</strong> — an ancestor who was officially granted arms. This requires a verifiable genealogy back to that person, usually several centuries deep.</li>
  <li><strong>You find a family Bible, signet ring, or portrait</strong> showing arms in use by your direct ancestors. Physical evidence still counts.</li>
  <li><strong>Your surname's region of origin had a famous House of the same name</strong> — but unless your line connects, you can admire that House's arms; you can't claim them.</li>
</ol>

<h2>What most families discover</h2>
<p>Most families learn that no specific medieval coat of arms was ever granted to their bloodline. That's the normal case worldwide. Only a tiny percentage of European families were ever formally armigerous.</p>
<p>And here is the part people miss: <strong>that doesn't mean your family doesn't deserve one.</strong> It means no one has made one yet.</p>

<h2>Forging your own (legitimately)</h2>
<p>You are allowed to design and use a coat of arms for your family. Heraldic authorities exist in some countries (notably Scotland and Canada) to officially register new arms for modern families — it is not a privilege locked in the Middle Ages.</p>
<p>Even without official registration, a thoughtfully composed family crest — built on traditional heraldic rules, with meaningful colours, a chosen charge, and a real motto — is exactly what your great-great-grandchildren will recognise as "our family crest" in eighty years. Every armigerous family started with a first person who designed theirs. Yours can start with you.</p>

<h2>What makes a crest meaningful</h2>
<ul>
  <li>It uses traditional heraldic colour rules (not random Pantone swatches).</li>
  <li>It includes a single, clear central charge — an animal, object, or symbol that says something true about your family.</li>
  <li>It carries a motto that is short, real, and worth being quoted at a funeral.</li>
  <li>It is rendered cleanly enough to hang on a wall for fifty years without looking dated.</li>
</ul>

<h2>The simplest place to start</h2>
<p>Begin with the meaning of your surname. The trade, region, or root meaning behind your last name is the most honest seed for a family crest — it makes the design about <em>your</em> ancestors, not someone else's.</p>
`,
    cta: {
      label: "Forge my family crest free",
      href: "/journey/1",
    },
  },
  {
    slug: "what-your-surname-says-about-your-ancestors",
    title: "What Your Surname Says About Your Ancestors (More Than You Think)",
    metaTitle: "What Your Surname Reveals About Your Ancestors",
    metaDescription:
      "Your last name carries more history than your birth certificate. Here is what surnames reveal about your ancestors' trade, region, status, and bloodline.",
    excerpt:
      "Your surname is a 600-year-old job description, address, or nickname — usually still readable if you know how to look. Here is what it actually says.",
    publishedAt: "2026-05-26",
    readMinutes: 6,
    bodyHtml: `
<p>Your surname is older than your birth certificate, older than your country in its current form, and very often older than the language you speak it in. It is the single oldest piece of evidence about your ancestors that you carry around every day — and most people never read it.</p>
<p>Here is what your last name can actually tell you about the people who came before you.</p>

<h2>Their trade</h2>
<p>If your surname is occupational, you are walking around with your ancestor's job title. <strong>Smith</strong>, <strong>Wright</strong>, <strong>Cooper</strong>, <strong>Mason</strong>, <strong>Taylor</strong>, <strong>Fletcher</strong>, <strong>Chandler</strong>, <strong>Fowler</strong>, <strong>Hayward</strong>, <strong>Shepherd</strong>. Every one of these is a medieval job description that stuck so hard it became a family identity. If your name is on that list, an ancestor of yours did that work, in a specific village, in a specific century — and the village remembered him for it.</p>

<h2>Their village</h2>
<p>Locational surnames tell you where your family came from. <strong>Hill</strong>, <strong>Brooks</strong>, <strong>Wood</strong>, <strong>Lancaster</strong>, <strong>Lincoln</strong>, <strong>York</strong>, <strong>Sutton</strong>. Sometimes the place is generic (a hill, a wood). Sometimes it is so specific you can put a pin on a map. Either way, your name is a postcode from 600 years ago.</p>

<h2>Their father</h2>
<p>Patronymic surnames record an ancestor's father's name. <strong>Johnson</strong> = son of John. <strong>O'Brien</strong> = descendant of Brien. <strong>MacDonald</strong> = son of Donald. <strong>Andersen</strong>, <strong>Petrov</strong>, <strong>Fitzgerald</strong>, <strong>Ivanov</strong> — different languages, same idea. Your name is a quiet acknowledgement that, at some moment, one specific man mattered enough to be carried forward by every one of his descendants.</p>

<h2>Their appearance or personality</h2>
<p>Descriptive surnames are blunt. <strong>Short</strong>, <strong>Long</strong>, <strong>Brown</strong>, <strong>Reid</strong> (red-haired), <strong>Armstrong</strong>, <strong>Swift</strong>, <strong>Cruikshank</strong> (bent leg). One ancestor was vivid enough that the whole village named the family after a single physical trait. That ancestor may have been six hundred years ago and you are still introducing yourself with his nickname.</p>

<h2>Their social standing</h2>
<p>Some surnames betray status. A <strong>Hayward</strong> was a trusted villager — he managed the common land and the hedges; that's a job given to a man the village trusted. A <strong>Reeve</strong> oversaw the lord's estate. A <strong>Marshal</strong> commanded horses, which meant commanding men. Even <strong>Knight</strong> usually meant "in the service of one," not actually titled — but it still meant something.</p>
<p>Other names point the other way. <strong>Cottar</strong>, <strong>Bond</strong>, <strong>Carter</strong>, <strong>Walker</strong> (a fuller of cloth, dirty work). Every village had a hierarchy, and surnames are the receipts.</p>

<h2>Their region of origin</h2>
<p>Even before you look at meaning, the <em>language</em> of your surname tells you where your family came from. A name ending in <strong>-ski</strong> points to Poland. <strong>-escu</strong> to Romania. <strong>-akis</strong> to Crete. <strong>Mc-</strong> or <strong>Mac-</strong> to Scotland or Ireland. <strong>Van-</strong> to the Netherlands. Even before genealogy, the shape of your name is a passport stamp.</p>

<h2>Their resilience</h2>
<p>The fact that you carry the name at all is evidence of survival. Every famine, war, plague, migration, and pogrom your family lived through left them still able to pass the name down one more generation. The name in your inbox today is a 25-generation chain that did not break. That is not nothing.</p>

<h2>How to actually read yours</h2>
<p>If you have never looked up the meaning of your surname, you are missing the most accessible piece of family history you own. It takes about thirty seconds, costs nothing, and almost always tells you something you didn't know about the people whose blood you carry.</p>
`,
    cta: {
      label: "Look up my surname free",
      href: "/tools/surname",
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
