import { useEffect, useMemo, useState } from "react";
import { breeding, locations, metadata, pals, resources } from "./data";
import { CollectionProvider, useCollection } from "./collection";
import type { HabitatTime, Pal, Resource } from "./types";

const elementIcons: Record<string, string> = {
  Neutral: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_00.webp",
  Fire: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_01.webp",
  Water: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_02.webp",
  Electric: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_03.webp",
  Grass: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_04.webp",
  Dark: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_05.webp",
  Dragon: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_06.webp",
  Ground: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_07.webp",
  Ice: "https://api.paldeck.cc/assets/palworld/elements/T_Icon_element_s_08.webp",
};

type Page =
  | { name: "home" }
  | { name: "pals" }
  | { name: "pal"; key: string }
  | { name: "ranch" }
  | { name: "work" }
  | { name: "build" }
  | { name: "breeding" }
  | { name: "resources" }
  | { name: "resource"; id: string }
  | { name: "owned" }
  | { name: "favourites" };

type SortMode = "number" | "name" | "rarity" | "breeding" | "work" | "owned" | "favourite";

type NewsItem = {
  title: string;
  url: string;
  date: string;
  summary: string;
};

type NavItem = {
  hash: string;
  label: string;
  icon: string;
};

const steamNewsApiUrl = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1623730&count=5&maxlength=900&format=json";

const fallbackNews: NewsItem[] = [
  {
    title: "Every new Pal in Palworld 1.0 and where to catch them",
    url: "https://store.steampowered.com/news/app/1623730",
    date: "2026-07-19",
    summary: "Palworld 1.0 added 72 new Pals alongside the expanded Palpagos map and World Tree region.",
  },
  {
    title: "Palworld reduces survival grind",
    url: "https://store.steampowered.com/news/app/1623730",
    date: "2026-07-18",
    summary: "Recent coverage highlights Palworld's faster base automation and less repetitive resource hauling.",
  },
  {
    title: "Ancient Bone and Ancient Civilization Core guides",
    url: "https://store.steampowered.com/news/app/1623730",
    date: "2026-07-16",
    summary: "Current update coverage points players toward rare late-game materials used for stronger equipment.",
  },
];

const levelZones = [
  { name: "Starter islands", range: "1-20", left: "61%", top: "56%", width: "29%", height: "13%", tilt: -10, color: "rgba(37, 207, 135, 0.7)", shape: "polygon(5% 44%, 16% 18%, 42% 4%, 74% 9%, 96% 34%, 91% 67%, 62% 91%, 27% 88%, 7% 68%)" },
  { name: "Bamboo groves", range: "10-20", left: "49%", top: "42%", width: "18%", height: "9%", tilt: -8, color: "rgba(44, 222, 118, 0.68)", shape: "polygon(4% 54%, 18% 22%, 48% 4%, 83% 17%, 97% 50%, 83% 80%, 44% 96%, 12% 78%)" },
  { name: "Central islands", range: "20-30", left: "52%", top: "49%", width: "24%", height: "12%", tilt: -10, color: "rgba(226, 214, 68, 0.68)", shape: "polygon(3% 48%, 19% 17%, 47% 5%, 79% 14%, 98% 43%, 90% 72%, 61% 92%, 27% 86%, 8% 68%)" },
  { name: "Small eastern isle", range: "20-30", left: "62%", top: "66%", width: "10%", height: "6%", tilt: -6, color: "rgba(226, 214, 68, 0.68)", shape: "polygon(8% 41%, 31% 12%, 73% 16%, 94% 49%, 76% 84%, 29% 88%, 6% 64%)" },
  { name: "Northern island", range: "30-40", left: "69%", top: "35%", width: "24%", height: "17%", tilt: -8, color: "rgba(181, 224, 78, 0.68)", shape: "polygon(8% 32%, 22% 8%, 53% 2%, 82% 14%, 98% 42%, 90% 72%, 60% 96%, 27% 85%, 5% 60%)" },
  { name: "Eastern strip", range: "30-40", left: "75%", top: "48%", width: "13%", height: "9%", tilt: -8, color: "rgba(181, 224, 78, 0.68)", shape: "polygon(3% 45%, 20% 18%, 53% 5%, 85% 19%, 97% 53%, 76% 84%, 34% 94%, 9% 72%)" },
  { name: "Volcanic island", range: "30-50", left: "39%", top: "51%", width: "23%", height: "18%", tilt: -8, color: "rgba(219, 103, 61, 0.68)", shape: "polygon(8% 34%, 27% 9%, 60% 4%, 88% 21%, 98% 55%, 80% 85%, 42% 95%, 12% 74%, 2% 52%)" },
  { name: "Northern ridge", range: "30-50", left: "46%", top: "33%", width: "21%", height: "12%", tilt: -9, color: "rgba(219, 103, 61, 0.68)", shape: "polygon(4% 46%, 18% 18%, 51% 4%, 85% 16%, 97% 49%, 75% 82%, 35% 92%, 8% 70%)" },
  { name: "Western highlands", range: "50-60", left: "33%", top: "40%", width: "16%", height: "9%", tilt: -7, color: "rgba(183, 98, 33, 0.72)", shape: "polygon(7% 48%, 25% 16%, 66% 7%, 94% 34%, 87% 70%, 48% 91%, 12% 75%)" },
  { name: "Far eastern island", range: "50-60", left: "86%", top: "34%", width: "8%", height: "6%", tilt: -4, color: "rgba(183, 98, 33, 0.72)", shape: "polygon(9% 47%, 31% 12%, 72% 15%, 94% 49%, 73% 86%, 26% 83%)" },
  { name: "Astral mountains", range: "60-70", left: "31%", top: "78%", width: "29%", height: "20%", tilt: -10, color: "rgba(188, 62, 217, 0.7)", shape: "polygon(5% 46%, 18% 17%, 47% 4%, 79% 10%, 96% 36%, 91% 66%, 64% 91%, 29% 95%, 7% 72%)" },
  { name: "Southern island", range: "60-70", left: "52%", top: "83%", width: "17%", height: "10%", tilt: -8, color: "rgba(188, 62, 217, 0.7)", shape: "polygon(8% 43%, 25% 14%, 66% 10%, 93% 36%, 86% 73%, 48% 92%, 13% 73%)" },
];

const priorityItems = [
  "Pick the next level zone before travelling so you do not waste ammo or food on enemies too high for your team.",
  "Keep one Pal focused on Kindling, one on Planting, one on Watering, one on Gathering, and two on Transporting for a stable starter base.",
  "Wishlist rare Pals from the Paldeck, then use their habitat map before you leave base.",
  "Check food, ingots, ammo, and repair materials before boss runs or dungeon loops.",
];

const workTypeNotes: Record<string, string> = {
  Cooling: "Keeps food and storage cold.",
  Farming: "Works at ranches for passive drops.",
  Gathering: "Harvests crops after they grow.",
  "Generating Electricity": "Charges power facilities.",
  Handiwork: "Crafts items and builds structures.",
  Kindling: "Cooks food and runs furnaces.",
  Lumbering: "Produces wood at logging sites.",
  "Medicine Production": "Makes medicine and clinic supplies.",
  Mining: "Produces stone, ore, and mining materials.",
  Planting: "Plants crops in plantations.",
  Transporting: "Moves dropped items into storage.",
  Watering: "Waters crops and powers mills/crushers.",
};

const ranchDropTokens: Record<string, string[]> = {
  berries: ["berries"],
  bone: ["bone"],
  cloth2: ["cloth2"],
  electricorgan: ["electricorgan"],
  egg: ["egg"],
  fireorgan: ["fireorgan"],
  honey: ["honey"],
  iceorgan: ["iceorgan"],
  leather: ["leather"],
  milk: ["milk"],
  money: ["money"],
  mushroom: ["mushroom"],
  palfluid: ["palfluid"],
  paloil: ["paloil"],
  sweet: ["sweet"],
  sweet_caramel: ["sweet-caramel"],
  venom: ["venom"],
  wool: ["wool"],
};

const navGroups: { title: string; items: NavItem[] }[] = [
  { title: "Dashboard", items: [{ hash: "#/", label: "Dashboard", icon: "home" }] },
  {
    title: "Pals",
    items: [
      { hash: "#/pals", label: "All Pals", icon: "pals" },
      { hash: "#/owned", label: "Owned", icon: "heart" },
      { hash: "#/favourites", label: "Wishlist", icon: "star" },
      { hash: "#/ranch", label: "Ranch", icon: "ranch" },
    ],
  },
  {
    title: "Guides",
    items: [
      { hash: "#/work", label: "Work Types", icon: "work" },
      { hash: "#/build", label: "Work Pals", icon: "build" },
      { hash: "#/breeding", label: "Breeding", icon: "egg" },
    ],
  },
  { title: "Items", items: [{ hash: "#/resources", label: "All Items", icon: "resource" }] },
];

const navItems = navGroups.flatMap((group) => group.items);
const mobileNavItems = navItems.filter((item) => ["#/", "#/pals", "#/build", "#/resources", "#/owned"].includes(item.hash));

function NavIcon({ name }: { name: string }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9.5 20v-5h5v5" />
      </svg>
    );
  }
  if (name === "egg") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c4.5 4.1 6.5 8.1 6.5 12a6.5 6.5 0 0 1-13 0C5.5 11.1 7.5 7.1 12 3Z" />
        <path d="M9 15.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5" />
      </svg>
    );
  }
  if (name === "resource") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" />
        <path d="m4.5 7.2 7.5 4.2 7.5-4.2" />
        <path d="M12 11.4V21" />
      </svg>
    );
  }
  if (name === "build") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14.5 5 4.5 4.5" />
        <path d="m16 3 5 5-2.5 2.5-5-5L16 3Z" />
        <path d="M4 20h5l8.5-8.5-5-5L4 15v5Z" />
        <path d="M4 15h5v5" />
      </svg>
    );
  }
  if (name === "ranch") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11h16" />
        <path d="M6 11v9" />
        <path d="M18 11v9" />
        <path d="M8 11V7l4-3 4 3v4" />
        <path d="M9.5 20v-5h5v5" />
      </svg>
    );
  }
  if (name === "work") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2 5 13h6l-1 9 8-12h-6l1-8Z" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 8.8c0 5.2-8.5 10.2-8.5 10.2S3.5 14 3.5 8.8A4.8 4.8 0 0 1 12 5.7a4.8 4.8 0 0 1 8.5 3.1Z" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </svg>
  );
}

function WorkIcon({ type }: { type: string }) {
  if (type === "Cooling") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </svg>
    );
  }
  if (type === "Farming") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20V9" />
        <path d="M12 13c-4 0-6-2-7-6 4 0 6 2 7 6Z" />
        <path d="M12 11c4 0 6-2 7-6-4 0-6 2-7 6Z" />
      </svg>
    );
  }
  if (type === "Gathering") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 19h12" />
        <path d="M8 19V9l4-4 4 4v10" />
        <path d="M9 12h6" />
      </svg>
    );
  }
  if (type === "Generating Electricity") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z" />
      </svg>
    );
  }
  if (type === "Handiwork") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14 5 5 5" />
        <path d="M4 20 17 7l-2-2L2 18v2h2Z" />
        <path d="m12 8 4 4" />
      </svg>
    );
  }
  if (type === "Kindling") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21c4 0 7-3 7-7 0-3-2-5-5-9-.2 3-1.4 4.2-3 5.4C9.4 8.8 9 7 9 5c-3 3-4 5.5-4 9 0 4 3 7 7 7Z" />
      </svg>
    );
  }
  if (type === "Lumbering") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20 20 4" />
        <path d="m14 4 6 6" />
        <path d="M5 15h7v7" />
      </svg>
    );
  }
  if (type === "Medicine Production") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 3h4" />
        <path d="M11 3v5l-5 8a4 4 0 0 0 3.4 6h5.2A4 4 0 0 0 18 16l-5-8V3" />
        <path d="M8 16h8" />
      </svg>
    );
  }
  if (type === "Mining") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14 4 6 6" />
        <path d="M13 5 4 14" />
        <path d="m7 21 4-4" />
        <path d="M5 19 3 17l4-4 2 2-4 4Z" />
      </svg>
    );
  }
  if (type === "Planting") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21V10" />
        <path d="M12 14c-5 0-7-3-8-8 5 0 7 3 8 8Z" />
        <path d="M12 12c5 0 7-3 8-8-5 0-7 3-8 8Z" />
      </svg>
    );
  }
  if (type === "Transporting") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7" />
        <path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    );
  }
  if (type === "Watering") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />
      </svg>
    );
  }
  return <NavIcon name="work" />;
}

function parseHash(): Page {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "pals" && parts[1]) return { name: "pal", key: parts[1] };
  if (parts[0] === "pals") return { name: "pals" };
  if (parts[0] === "ranch") return { name: "ranch" };
  if (parts[0] === "work") return { name: "work" };
  if (parts[0] === "build") return { name: "build" };
  if (parts[0] === "breeding") return { name: "breeding" };
  if (parts[0] === "resources" && parts[1]) return { name: "resource", id: parts[1] };
  if (parts[0] === "resources") return { name: "resources" };
  if (parts[0] === "owned") return { name: "owned" };
  if (parts[0] === "favourites") return { name: "favourites" };
  return { name: "home" };
}

function routeFor(page: Page) {
  if (page.name === "pal") return `#/pals/${page.key}`;
  if (page.name === "resource") return `#/resources/${page.id}`;
  if (page.name === "home") return "#/";
  return `#/${page.name}`;
}

function AppShell() {
  const [page, setPage] = useState<Page>(parseHash);
  const [theme] = useState(localStorage.getItem("palworld-companion.theme") || "dark");

  useEffect(() => {
    const onHash = () => setPage(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("palworld-companion.theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#/" aria-label="Palworld Companion home">
          <span className="brand-mark">P</span>
          <span>
            <strong>Palworld</strong>
            <small>Companion</small>
          </span>
        </a>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => (
                <a key={item.hash} className={routeFor(page) === item.hash ? "active" : ""} href={item.hash}>
                  <span className="nav-icon"><NavIcon name={item.icon} /></span>
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main>
        <PageContent page={page} />
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mobileNavItems.map((item) => (
          <a key={item.hash} className={routeFor(page) === item.hash ? "active" : ""} href={item.hash}>
            <span className="nav-icon"><NavIcon name={item.icon} /></span>
            <small>{item.label}</small>
          </a>
        ))}
      </nav>
    </div>
  );
}

function PageContent({ page }: { page: Page }) {
  if (page.name === "pals") return <PalsPage />;
  if (page.name === "pal") return <PalDetailsPage palKey={page.key} />;
  if (page.name === "ranch") return <RanchPage />;
  if (page.name === "work") return <WorkPage />;
  if (page.name === "build") return <BuildPage />;
  if (page.name === "breeding") return <BreedingPage />;
  if (page.name === "resources") return <ResourcesPage />;
  if (page.name === "resource") return <ResourceDetailsPage resourceId={page.id} />;
  if (page.name === "owned") return <PalCollectionPage mode="owned" />;
  if (page.name === "favourites") return <PalCollectionPage mode="favourites" />;
  return <HomePage />;
}

function Hero({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <section className="hero">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children}
    </section>
  );
}

function HomePage() {
  const { collection } = useCollection();
  const owned = collection.ownedPalIds.length;
  const favourites = collection.favouritePalIds.length;
  const completion = Math.round((owned / pals.length) * 100);
  const recentlyViewed = collection.recentlyViewedPalIds.map(findPal).filter(Boolean) as Pal[];
  const favouritePals = collection.favouritePalIds.map(findPal).filter(Boolean) as Pal[];

  return (
    <>
      <Hero title="Palworld Companion" eyebrow="Planning dashboard">
        <GlobalSearch />
      </Hero>
      <section className="stats-grid">
        <Stat label="Total Pals" value={pals.length.toString()} />
        <Stat label="Owned" value={`${owned} / ${pals.length}`} />
        <Stat label="Favourites" value={favourites.toString()} />
        <Stat label="Completion" value={`${completion}%`} />
      </section>
      <section className="category-grid">
        <CategoryCard href="#/pals" icon="pals" title="All Pals" detail={`${pals.length} Paldeck entries`} />
        <CategoryCard href="#/owned" icon="heart" title="Owned Pals" detail={`${owned} marked owned`} />
        <CategoryCard href="#/favourites" icon="star" title="Wishlist" detail={`${favourites} saved targets`} />
        <CategoryCard href="#/ranch" icon="ranch" title="Ranch Drops" detail={`${ranchPals().length} Farming Pals`} />
        <CategoryCard href="#/work" icon="work" title="Work Types" detail={`${unique(pals.flatMap((pal) => pal.workSuitability.map((work) => work.type))).length} base jobs`} />
        <CategoryCard href="#/resources" icon="resource" title="Items" detail={`${resources.length} resources`} />
      </section>
      <section className="home-dashboard">
        <LevelMapPanel />
        <LatestUpdatesPanel />
        <Panel title="Next Useful Checks">
          <ul className="priority-list">
            {priorityItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Panel>
      </section>
      <section className="split">
        <Panel title="Recently Viewed">
          <MiniPalList pals={recentlyViewed} empty="No recently viewed Pals yet." />
        </Panel>
        <Panel title="Favourite Pals">
          <MiniPalList pals={favouritePals.slice(0, 6)} empty="No favourites yet." />
        </Panel>
      </section>
      <section className="metadata">
        <span>Game version: {metadata.gameVersion}</span>
        <span>Data update: {metadata.lastUpdated}</span>
      </section>
    </>
  );
}

function CategoryCard({ href, icon, title, detail }: { href: string; icon: string; title: string; detail: string }) {
  return (
    <a className="category-card" href={href}>
      <span className="nav-icon"><NavIcon name={icon} /></span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </a>
  );
}

function LevelMapPanel() {
  return (
    <Panel title="Map Level Guide" className="level-map-panel">
      <div className="level-map" aria-label="Palpagos level range map">
        {levelZones.map((zone) => (
          <span
            className="level-zone"
            key={zone.name}
            style={{
              left: zone.left,
              top: zone.top,
              width: zone.width,
              height: zone.height,
              backgroundColor: zone.color,
              clipPath: zone.shape,
              transform: `translate(-50%, -50%) rotate(${zone.tilt}deg)`,
            }}
          >
            <strong>{zone.range}</strong>
          </span>
        ))}
      </div>
      <div className="level-legend">
        {levelZones.map((zone) => (
          <div key={zone.name}>
            <strong>{zone.range}</strong>
            <span>{zone.name}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LatestUpdatesPanel() {
  const { news, status } = useLatestNews();
  return (
    <Panel title="Recent Updates">
      <div className="news-list">
        {news.map((item) => (
          <a className="news-card" href={item.url} target="_blank" rel="noreferrer" key={`${item.date}-${item.title}`}>
            <span>{item.date}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
          </a>
        ))}
      </div>
      <p className="feed-status">{status}</p>
    </Panel>
  );
}

function WorkPalsPlanner({ title = "Work Pals" }: { title?: string }) {
  const { isOwned } = useCollection();
  const jobs = useMemo(() => unique(pals.flatMap((pal) => pal.workSuitability.map((work) => work.type))), []);
  const [job, setJob] = useState(jobs.includes("Mining") ? "Mining" : jobs[0] || "");
  const [targets, setTargets] = useState<Record<string, number | undefined>>({});
  const candidates = useMemo(() => {
    return pals
      .flatMap((pal) => pal.workSuitability.filter((work) => work.type === job).map((work) => ({ pal, work })))
      .sort((a, b) => b.work.level - a.work.level || a.pal.name.localeCompare(b.pal.name))
      .slice(0, 6);
  }, [job]);
  const selectedTarget = targets[job];

  return (
    <Panel title={title} className="work-pals-panel">
      <div className="job-tabs" role="list" aria-label="Base jobs">
        {jobs.slice(0, 10).map((item) => (
          <button className={item === job ? "toggle active" : "toggle"} type="button" key={item} onClick={() => setJob(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="planner-grid">
        {candidates.map(({ pal, work }) => (
          <button
            className={selectedTarget === pal.id ? "planner-row selected" : "planner-row"}
            type="button"
            key={pal.id}
            onClick={() => setTargets((current) => ({ ...current, [job]: current[job] === pal.id ? undefined : pal.id }))}
          >
            <Avatar text={pal.image} label={pal.name} />
            <span>
              <strong>{pal.name}</strong>
              <small>{work.type} Lv. {work.level}{isOwned(pal.id) ? " - Owned" : ""}</small>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function useLatestNews() {
  const [news, setNews] = useState(fallbackNews);
  const [status, setStatus] = useState("Refreshing from Steam news...");

  useEffect(() => {
    const controller = new AbortController();
    fetch(steamNewsApiUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("News feed unavailable");
        return response.json();
      })
      .then((data) => {
        const items = (data?.appnews?.newsitems || [])
          .map((item: { title?: string; url?: string; date?: number; contents?: string }) => ({
            title: item.title || "Palworld update",
            url: item.url || "https://store.steampowered.com/news/app/1623730",
            date: item.date ? new Date(item.date * 1000).toISOString().slice(0, 10) : "",
            summary: trimSummary(cleanNewsText(item.contents || "")),
          }))
          .filter((item: NewsItem) => item.title && item.summary);
        if (items.length) setNews(items.slice(0, 4));
        setStatus(`Updated when this page loaded: ${new Date().toLocaleString()}`);
      })
      .catch(() => setStatus("Showing saved update summary. Refresh to try the live feed again."));

    return () => controller.abort();
  }, []);

  return { news, status };
}

function cleanNewsText(text: string) {
  const withoutTags = text.replace(/<[^>]*>/g, " ");
  const textarea = document.createElement("textarea");
  textarea.innerHTML = withoutTags;
  return textarea.value.replace(/\s+/g, " ").trim();
}

function trimSummary(text: string) {
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trim()}...`;
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const palResults = normalized
    ? pals.filter((pal) =>
        [pal.name, pal.id.toString(), ...pal.elements, ...pal.workSuitability.map((work) => work.type)]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
    : [];
  const resourceResults = normalized
    ? resources.filter((resource) => `${resource.name} ${resource.category}`.toLowerCase().includes(normalized))
    : [];

  return (
    <div className="global-search">
      <label htmlFor="global-search">Search Pals, resources, drops, and work skills</label>
      <input
        id="global-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try Fire, Wool, Mining, or Anubis"
      />
      {normalized && (
        <div className="search-results">
          <strong>Pals</strong>
          {palResults.length ? palResults.slice(0, 5).map((pal) => <a key={pal.id} href={`#/pals/${pal.key}`}>{pal.name}</a>) : <span>No Pal matches.</span>}
          <strong>Resources</strong>
          {resourceResults.length ? resourceResults.slice(0, 5).map((resource) => <a key={resource.id} href={`#/resources/${resource.id}`}>{resource.name}</a>) : <span>No resource matches.</span>}
        </div>
      )}
    </div>
  );
}

function PalsPage() {
  return (
    <>
      <Hero title="Paldeck" eyebrow="Search, filter, sort" />
      <PalBrowser palsToShow={pals} context="all" />
    </>
  );
}

function PalCollectionPage({ mode }: { mode: "owned" | "favourites" }) {
  const { collection } = useCollection();
  const filtered = pals.filter((pal) => (mode === "owned" ? collection.ownedPalIds.includes(pal.id) : collection.favouritePalIds.includes(pal.id)));
  const isFavouritePage = mode === "favourites";

  return (
    <>
      <Hero title={isFavouritePage ? "Favourites" : "Owned Pals"} eyebrow={isFavouritePage ? "Targets you want to find" : "Collection progress"}>
        <p>
          {isFavouritePage
            ? "Favourite Pals stay saved even after you mark them owned."
            : `Owned: ${filtered.length} / ${pals.length}. Completion: ${Math.round((filtered.length / pals.length) * 100)}%.`}
        </p>
      </Hero>
      {filtered.length ? (
        <PalBrowser palsToShow={filtered} context={mode} />
      ) : (
        <EmptyState text={isFavouritePage ? "You have not favourited any Pals yet. Use the star button to save Pals you want to find later." : "You have not checked off any Pals yet. Browse the Paldeck and mark the ones you already have."} />
      )}
    </>
  );
}

function PalBrowser({ palsToShow, context }: { palsToShow: Pal[]; context: "all" | "owned" | "favourites" }) {
  const { isOwned, isFavourite } = useCollection();
  const [query, setQuery] = useState("");
  const [element, setElement] = useState("all");
  const [work, setWork] = useState("all");
  const [habitat, setHabitat] = useState<"all" | HabitatTime>("all");
  const [favouriteState, setFavouriteState] = useState("all");
  const [sort, setSort] = useState<SortMode>("number");
  const [compact, setCompact] = useState(false);

  const elements = unique(pals.flatMap((pal) => pal.elements));
  const workTypes = unique(pals.flatMap((pal) => pal.workSuitability.map((item) => item.type)));

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return palsToShow
      .filter((pal) => !normalized || `${pal.name} ${pal.id} ${pal.elements.join(" ")}`.toLowerCase().includes(normalized))
      .filter((pal) => element === "all" || pal.elements.includes(element))
      .filter((pal) => work === "all" || pal.workSuitability.some((item) => item.type === work))
      .filter((pal) => habitat === "all" || pal.habitats.some((item) => item.time === habitat))
      .filter((pal) => {
        if (favouriteState === "not-owned") return isFavourite(pal.id) && !isOwned(pal.id);
        if (favouriteState === "owned") return isOwned(pal.id);
        return true;
      })
      .sort((a, b) => comparePals(a, b, sort, isOwned, isFavourite));
  }, [query, element, work, habitat, favouriteState, sort, palsToShow, isOwned, isFavourite]);

  return (
    <section className="browser">
      <div className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or number" aria-label="Search Pals" />
        <select value={element} onChange={(event) => setElement(event.target.value)} aria-label="Filter by element">
          <option value="all">All elements</option>
          {elements.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={work} onChange={(event) => setWork(event.target.value)} aria-label="Filter by work suitability">
          <option value="all">All work</option>
          {workTypes.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={habitat} onChange={(event) => setHabitat(event.target.value as "all" | HabitatTime)} aria-label="Filter by habitat time">
          <option value="all">Any habitat</option>
          <option value="day">Day</option>
          <option value="night">Night</option>
          <option value="both">Both</option>
          <option value="unknown">Map spawns</option>
        </select>
        {context === "favourites" && (
          <select value={favouriteState} onChange={(event) => setFavouriteState(event.target.value)} aria-label="Filter favourites by owned status">
            <option value="all">All favourites</option>
            <option value="not-owned">Not yet owned</option>
            <option value="owned">Already owned</option>
          </select>
        )}
        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort Pals">
          <option value="number">Paldeck number</option>
          <option value="name">Name</option>
          <option value="rarity">Rarity</option>
          <option value="breeding">Breeding power</option>
          <option value="work">Highest work</option>
          <option value="owned">Owned status</option>
          <option value="favourite">Favourite status</option>
        </select>
        <button type="button" onClick={() => setCompact(!compact)}>{compact ? "Grid view" : "Compact view"}</button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setElement("all");
            setWork("all");
            setHabitat("all");
            setFavouriteState("all");
          }}
        >
          Clear filters
        </button>
      </div>
      <p className="result-count">{filtered.length} matching Pals</p>
      {filtered.length ? (
        <div className={compact ? "pal-list compact" : "pal-list"}>
          {filtered.map((pal) => <PalCard key={pal.id} pal={pal} compact={compact} />)}
        </div>
      ) : (
        <EmptyState text="No Pals match those filters." />
      )}
    </section>
  );
}

function PalCard({ pal, compact }: { pal: Pal; compact?: boolean }) {
  const { isOwned, isFavourite, toggleOwned, toggleFavourite } = useCollection();
  const strongest = strongestWork(pal);
  return (
    <article className={compact ? "pal-card compact-card" : "pal-card"}>
      <button
        type="button"
        className={isFavourite(pal.id) ? "star-button active" : "star-button"}
        onClick={() => toggleFavourite(pal.id)}
        aria-pressed={isFavourite(pal.id)}
        aria-label={isFavourite(pal.id) ? `Remove ${pal.name} from favourites` : `Add ${pal.name} to favourites`}
        title={isFavourite(pal.id) ? "Remove favourite" : "Add favourite"}
      >
        {isFavourite(pal.id) ? "★" : "☆"}
      </button>
      <a className="pal-link" href={`#/pals/${pal.key}`}>
        <Avatar text={pal.image} label={pal.name} />
        <div>
          <span className="number">#{displayPalNumber(pal)}</span>
          <h3>{pal.name}</h3>
          <div className="pal-meta">
            <ElementList elements={pal.elements} />
            <span>{strongest ? `${strongest.type} ${strongest.level}` : "No work data"}</span>
          </div>
          <HabitatBadges pal={pal} />
        </div>
      </a>
      <div className="card-actions">
        <button type="button" className={isOwned(pal.id) ? "toggle active" : "toggle"} onClick={() => toggleOwned(pal.id)} aria-pressed={isOwned(pal.id)} title={`Toggle owned for ${pal.name}`}>
          ✓ <span>{isOwned(pal.id) ? "Owned" : "Own"}</span>
        </button>
      </div>
    </article>
  );
}

function PalDetailsPage({ palKey }: { palKey: string }) {
  const pal = pals.find((item) => item.key === palKey);
  const { isOwned, isFavourite, toggleOwned, toggleFavourite, markViewed } = useCollection();

  useEffect(() => {
    if (pal) markViewed(pal.id);
  }, [pal?.id]);

  if (!pal) return <EmptyState text="Pal not found." />;

  const currentIndex = pals.findIndex((item) => item.id === pal.id);
  const previous = pals[currentIndex - 1];
  const next = pals[currentIndex + 1];

  return (
    <>
      <section className="detail-hero">
        <Avatar text={pal.image} label={pal.name} large />
        <div>
          <span className="number">#{displayPalNumber(pal)}</span>
          <h1>{pal.name}</h1>
          {pal.variant ? <p>{pal.variant}</p> : <ElementList elements={pal.elements} />}
          <div className="card-actions">
            <button className={isOwned(pal.id) ? "toggle active" : "toggle"} onClick={() => toggleOwned(pal.id)} aria-pressed={isOwned(pal.id)}>✓ {isOwned(pal.id) ? "Owned" : "Mark owned"}</button>
            <button className={isFavourite(pal.id) ? "toggle active favourite" : "toggle"} onClick={() => toggleFavourite(pal.id)} aria-pressed={isFavourite(pal.id)}>{isFavourite(pal.id) ? "★ Favourite" : "☆ Add favourite"}</button>
          </div>
          <div className="prev-next">
            {previous && <a href={`#/pals/${previous.key}`}>Previous: {previous.name}</a>}
            {next && <a href={`#/pals/${next.key}`}>Next: {next.name}</a>}
          </div>
        </div>
      </section>
      <section className="pal-detail-grid">
        <Panel title="Overview" className="panel-wide">
          <p>{pal.description || "Information not currently available."}</p>
          <InfoRows rows={overviewRows(pal)} />
        </Panel>
        <Panel title="Work Suitability">
          {pal.workSuitability.length ? pal.workSuitability.map((work) => <Badge key={work.type}>{work.type} Lv. {work.level}</Badge>) : <p>Information not currently available.</p>}
        </Panel>
        <Panel title="Drops">
          {pal.possibleDrops.length ? pal.possibleDrops.map((drop) => {
            const resource = findResource(drop.resourceId);
            return <a className="resource-link" key={drop.resourceId} href={`#/resources/${drop.resourceId}`}>{resource?.name || drop.resourceId}{drop.notes ? ` - ${drop.notes}` : ""}</a>;
          }) : <p>Information not currently available.</p>}
        </Panel>
        <Panel title="Habitat" className="panel-wide">
          <HabitatSection pal={pal} />
        </Panel>
        <Panel title="Breeding">
          <BreedingForPal pal={pal} />
        </Panel>
      </section>
    </>
  );
}

function HabitatSection({ pal }: { pal: Pal }) {
  const groups: HabitatTime[] = ["unknown", "day", "night", "both"];
  const hasHabitats = pal.habitats.length > 0;
  return (
    <>
      {groups.map((time) => {
        const entries = pal.habitats.filter((habitat) => habitat.time === time);
        return (
          <div key={time} className="habitat-group">
            <h4>{timeLabel(time)}</h4>
            {entries.length ? entries.map((entry) => (
              <div key={`${entry.locationId}-${entry.time}`} className="spawn-entry">
                <p>
                  <strong>{entry.mapName || findLocation(entry.locationId)?.name || entry.locationId}</strong>
                  {entry.spawnCount ? ` - ${entry.spawnCount} known markers` : ""}
                </p>
                <p>{entry.notes || "Information not currently available."}</p>
                {entry.sourceUrl && <a className="resource-link" href={entry.sourceUrl} target="_blank" rel="noreferrer">Open interactive spawn map</a>}
                {entry.coordinates?.length ? <SpawnMapPreview coordinates={entry.coordinates} totalMarkers={entry.spawnCount} /> : null}
                {entry.coordinates?.length ? (
                  <p className="coordinate-note">
                    Showing spawn areas from {entry.coordinates.length === entry.spawnCount ? entry.coordinates.length : `${entry.coordinates.length} of ${entry.spawnCount || entry.coordinates.length}`} imported spawn points.
                  </p>
                ) : null}
              </div>
            )) : <p>None listed.</p>}
          </div>
        );
      })}
      {pal.alphaLocations?.length ? (
        <div className="habitat-group">
          <h4>Alpha or special</h4>
          {pal.alphaLocations.map((entry) => <p key={entry.locationId}>{findLocation(entry.locationId)?.name || entry.locationId}{entry.level ? `, level ${entry.level}` : ""}. {entry.notes || ""}</p>)}
        </div>
      ) : null}
      {!hasHabitats && !pal.alphaLocations?.length && <p>Information not currently available.</p>}
    </>
  );
}

function BreedingPage() {
  const [parentA, setParentA] = useState(pals[0].id);
  const [parentB, setParentB] = useState(pals[1].id);
  const [desired, setDesired] = useState(pals[3].id);
  const result = breeding.find((combo) => sameParents(combo.parentAId, combo.parentBId, parentA, parentB));
  const desiredCombos = breeding.filter((combo) => combo.childId === desired);

  return (
    <>
      <Hero title="Breeding" eyebrow="Breeding calculator">
        <p>Combinations appear here when they are available in the companion data.</p>
      </Hero>
      <section className="split">
        <Panel title="Two Parents to Child">
          <PalSelect label="Parent A" value={parentA} onChange={setParentA} />
          <PalSelect label="Parent B" value={parentB} onChange={setParentB} />
          {result ? <BreedingResult comboId={result.id} childId={result.childId} /> : <EmptyState text="No direct combination found." />}
        </Panel>
        <Panel title="Desired Child">
          <PalSelect label="Desired Pal" value={desired} onChange={setDesired} />
          {desiredCombos.length ? desiredCombos.map((combo) => <BreedingPair key={combo.id} combo={combo} />) : <EmptyState text="No known combinations for this Pal." />}
        </Panel>
      </section>
    </>
  );
}

function BuildPage() {
  return (
    <>
      <Hero title="Work Pals" eyebrow="Base job recommendations">
        <p>Pick a work type to see the strongest Pals for that job.</p>
      </Hero>
      <WorkPalsPlanner />
    </>
  );
}

function WorkPage() {
  const jobs = unique(pals.flatMap((pal) => pal.workSuitability.map((work) => work.type)));
  const [selectedWork, setSelectedWork] = useState(jobs.includes("Kindling") ? "Kindling" : jobs[0] || "");
  const bestPals = pals
    .flatMap((pal) => pal.workSuitability.filter((work) => work.type === selectedWork).map((work) => ({ pal, work })))
    .sort((a, b) => b.work.level - a.work.level || a.pal.name.localeCompare(b.pal.name))
    .slice(0, 10);

  return (
    <>
      <Hero title="Work Types" eyebrow="Base job guide">
        <p>Pick a work type to see what it does and which Pals are best suited to it.</p>
      </Hero>
      <section className="work-page">
        <div className="work-filter-bar" role="list" aria-label="Work type filters">
          {jobs.map((job) => (
            <button
              className={selectedWork === job ? "work-filter active" : "work-filter"}
              type="button"
              key={job}
              onClick={() => setSelectedWork(job)}
              aria-pressed={selectedWork === job}
              title={workTypeNotes[job] || job}
            >
              <span className="work-icon"><WorkIcon type={job} /></span>
              <span>{job}</span>
            </button>
          ))}
        </div>
        <Panel title={`Best ${selectedWork} Pals`} className="recommendations-panel">
          <p>{workTypeNotes[selectedWork] || "Base work suitability."}</p>
          <div className="ranked-list">
            {bestPals.map(({ pal, work }, index) => (
              <a className="ranked-row" href={`#/pals/${pal.key}`} key={pal.id}>
                <span>{index + 1}</span>
                <Avatar text={pal.image} label={pal.name} />
                <strong>{pal.name}</strong>
                <small>Lv. {work.level}</small>
              </a>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}

function RanchPage() {
  const dropGroups = ranchDropGroups();
  return (
    <>
      <Hero title="Ranch Drops" eyebrow="Grouped by item">
        <p>Pick the item you need, then choose a Farming Pal that can make it at the Ranch.</p>
      </Hero>
      <section className="ranch-drop-grid">
        {dropGroups.map((group) => (
          <article className="ranch-drop-card" key={group.resource.id}>
            <header>
              <a href={`#/resources/${group.resource.id}`}>
                <Avatar text={group.resource.image} label={group.resource.name} />
                <span>
                  <strong>{group.resource.name}</strong>
                  <small>{group.pals.length} {group.pals.length === 1 ? "Pal" : "Pals"}</small>
                </span>
              </a>
            </header>
            <div className="ranch-pal-grid">
              {group.pals.map(({ pal, farmingLevel }) => (
                <a className="ranch-pal-chip" href={`#/pals/${pal.key}`} key={pal.id}>
                  <Avatar text={pal.image} label={pal.name} />
                  <span>
                    <strong>{pal.name}</strong>
                    <small>Farming Lv. {farmingLevel || "?"}</small>
                  </span>
                </a>
              ))}
            </div>
          </article>
        ))}
        {!dropGroups.length && (
          <article className="empty-card">
            <h3>No Ranch drops found</h3>
            <p>Ranch drop data is not currently available.</p>
          </article>
        )}
      </section>
    </>
  );
}

function ranchDropIdsForPal(pal: Pal) {
  const description = pal.partnerSkill?.description || "";
  const ids = new Set<string>();

  Object.entries(ranchDropTokens).forEach(([token, resourceIds]) => {
    if (description.includes(`${token}|`)) {
      resourceIds.forEach((resourceId) => ids.add(resourceId));
    }
  });

  if (description.includes("various seeds")) {
    pal.possibleDrops.forEach((drop) => {
      if (drop.resourceId.includes("seeds")) ids.add(drop.resourceId);
    });
  }

  if (description.includes("digs up items")) {
    ["arrow", "bone", "money"].forEach((resourceId) => ids.add(resourceId));
  }

  return Array.from(ids);
}

function ranchDropGroups() {
  const groups = new Map<string, { resource: Resource; pals: { pal: Pal; farmingLevel: number }[] }>();

  ranchPals().forEach((pal) => {
    const farmingLevel = pal.workSuitability.find((work) => work.type === "Farming")?.level || 0;
    ranchDropIdsForPal(pal).forEach((resourceId) => {
      const resource = findResource(resourceId);
      if (!resource) return;
      if (!groups.has(resource.id)) {
        groups.set(resource.id, { resource, pals: [] });
      }
      groups.get(resource.id)?.pals.push({ pal, farmingLevel });
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      pals: group.pals.sort((a, b) => b.farmingLevel - a.farmingLevel || a.pal.name.localeCompare(b.pal.name)),
    }))
    .sort((a, b) => a.resource.name.localeCompare(b.resource.name));
}

function BreedingForPal({ pal }: { pal: Pal }) {
  const childCombos = breeding.filter((combo) => combo.childId === pal.id);
  const parentCombos = breeding.filter((combo) => combo.parentAId === pal.id || combo.parentBId === pal.id);
  return (
    <>
      <h4>Breed this Pal</h4>
      {childCombos.length ? childCombos.map((combo) => <BreedingPair key={combo.id} combo={combo} />) : <p>Information not currently available.</p>}
      <h4>Use this Pal as a parent</h4>
      {parentCombos.length ? parentCombos.map((combo) => <BreedingPair key={combo.id} combo={combo} />) : <p>Information not currently available.</p>}
    </>
  );
}

function BreedingPair({ combo }: { combo: { parentAId: number; parentBId: number; childId: number; specialCombination?: boolean; notes?: string } }) {
  const parentA = findPal(combo.parentAId);
  const parentB = findPal(combo.parentBId);
  const child = findPal(combo.childId);
  return (
    <div className="breeding-row">
      <a href={`#/pals/${parentA?.key}`}>{parentA?.name}</a>
      <span>+</span>
      <a href={`#/pals/${parentB?.key}`}>{parentB?.name}</a>
      <span>=</span>
      <a href={`#/pals/${child?.key}`}>{child?.name}</a>
      {combo.specialCombination && <Badge>Special</Badge>}
    </div>
  );
}

function BreedingResult({ comboId, childId }: { comboId: string; childId: number }) {
  const child = findPal(childId);
  const { isOwned, isFavourite } = useCollection();
  if (!child) return null;
  return (
    <div className="result-card">
      <Avatar text={child.image} label={child.name} />
      <div>
        <p>Result from {comboId}</p>
        <h3><a href={`#/pals/${child.key}`}>{child.name}</a></h3>
        <p>{child.elements.join(" / ")} - {child.eggType || "Egg unknown"}</p>
        <p>{isOwned(child.id) ? "Owned" : "Not owned"} - {isFavourite(child.id) ? "Favourite" : "Not favourite"}</p>
      </div>
    </div>
  );
}

function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = unique(resources.map((resource) => resource.category));
  const filtered = resources.filter((resource) => {
    const matchesQuery = !query || `${resource.name} ${resource.category} ${resource.description || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || resource.category === category;
    return matchesQuery && matchesCategory;
  });
  return (
    <>
      <Hero title="Resources" eyebrow="Where to get it, what it is for" />
      <section className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter resource category">
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>
      <section className="resource-grid">
        {filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
      </section>
    </>
  );
}

function ResourceDetailsPage({ resourceId }: { resourceId: string }) {
  const resource = findResource(resourceId);
  if (!resource) return <EmptyState text="Resource not found." />;
  return (
    <>
      <section className="detail-hero">
        <Avatar text={resource.image} label={resource.name} large />
        <div>
          <span className="number">{resource.category}</span>
          <h1>{resource.name}</h1>
          <p>{resource.description || "Information not currently available."}</p>
        </div>
      </section>
      <section className="detail-grid">
        <Panel title="Where to Find It">
          {resource.obtainedFrom.map((entry) => (
            <p key={`${entry.type}-${entry.name}`}>
              {entry.name}
              {entry.palId && findPal(entry.palId) ? <> - <a href={`#/pals/${findPal(entry.palId)?.key}`}>{findPal(entry.palId)?.name}</a></> : null}
              {entry.locationId && findLocation(entry.locationId) ? <> - {findLocation(entry.locationId)?.name}</> : null}
              {entry.notes ? ` - ${entry.notes}` : ""}
            </p>
          ))}
        </Panel>
        <Panel title="Uses">
          {resource.usedFor.length ? resource.usedFor.map((use) => <p key={`${use.type}-${use.name}`}>{use.name}{use.quantity ? ` x${use.quantity}` : ""} - {use.type}</p>) : <p>Information not currently available.</p>}
        </Panel>
      </section>
    </>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a className="resource-card" href={`#/resources/${resource.id}`}>
      <Avatar text={resource.image} label={resource.name} />
      <div>
        <h3>{resource.name}</h3>
        <p>{resource.category}</p>
        <small>{resource.description || "Information not currently available."}</small>
      </div>
    </a>
  );
}

function PalSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {pals.map((pal) => <option key={pal.id} value={pal.id}>{displayPalNumber(pal)} - {pal.name}</option>)}
      </select>
    </label>
  );
}

function MiniPalList({ pals: miniPals, empty }: { pals: Pal[]; empty: string }) {
  if (!miniPals.length) return <p>{empty}</p>;
  return (
    <div className="mini-list">
      {miniPals.map((pal) => <a key={pal.id} href={`#/pals/${pal.key}`}>{pal.name}</a>)}
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}

function ElementList({ elements }: { elements: string[] }) {
  if (!elements.length) return <span className="element-list">Element unknown</span>;
  return (
    <span className="element-list">
      {elements.map((element) => (
        <span className="element-chip" key={element}>
          {elementIcons[element] ? <img src={elementIcons[element]} alt="" aria-hidden="true" /> : null}
          {element}
        </span>
      ))}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <section className="empty-state">{text}</section>;
}

function Avatar({ text, label, large }: { text: string; label: string; large?: boolean }) {
  const isUrl = /^https?:\/\//.test(text);
  return (
    <span className={large ? "avatar large" : "avatar"} aria-label={label}>
      {isUrl ? <img src={text} alt={label} loading="lazy" /> : text}
    </span>
  );
}

function HabitatBadges({ pal }: { pal: Pal }) {
  const times = unique(pal.habitats.map((habitat) => habitat.time)).filter((time) => time !== "unknown");
  if (!times.length && !pal.alphaLocations?.length) return null;
  return (
    <div className="badges">
      {times.map((time) => <Badge key={time}>{timeLabel(time)}</Badge>)}
      {pal.alphaLocations?.length ? <Badge>Alpha</Badge> : null}
    </div>
  );
}

function InfoRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="info-rows">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function comparePals(a: Pal, b: Pal, sort: SortMode, isOwned: (id: number) => boolean, isFavourite: (id: number) => boolean) {
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "rarity") return (b.rarity || 0) - (a.rarity || 0);
  if (sort === "breeding") return (a.breedingPower || 9999) - (b.breedingPower || 9999);
  if (sort === "work") return highestWork(b) - highestWork(a);
  if (sort === "owned") return Number(isOwned(b.id)) - Number(isOwned(a.id));
  if (sort === "favourite") return Number(isFavourite(b.id)) - Number(isFavourite(a.id));
  return a.id - b.id;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items)).sort();
}

function strongestWork(pal: Pal) {
  return [...pal.workSuitability].sort((a, b) => b.level - a.level)[0];
}

function highestWork(pal: Pal) {
  return strongestWork(pal)?.level || 0;
}

function overviewRows(pal: Pal): [string, string][] {
  const rows: [string, string][] = [
    ["Paldeck", `#${displayPalNumber(pal)}`],
    ["Elements", pal.elements.length ? pal.elements.join(" / ") : "Information not currently available."],
  ];
  const work = strongestWork(pal);
  if (work) rows.push(["Best work", `${work.type} Lv. ${work.level}`]);
  if (pal.workSuitability.length) rows.push(["Work skills", pal.workSuitability.length.toString()]);
  if (pal.possibleDrops.length) rows.push(["Known drops", pal.possibleDrops.length.toString()]);
  const spawnCount = pal.habitats.reduce((total, habitat) => total + (habitat.spawnCount || 0), 0);
  if (spawnCount) rows.push(["Wild spawns", `${spawnCount} map markers`]);
  if (pal.eggType) rows.push(["Egg type", pal.eggType]);
  if (typeof pal.rarity === "number") rows.push(["Rarity", pal.rarity.toString()]);
  if (pal.alpha) rows.push(["Alpha", "Yes"]);
  if (pal.legendary) rows.push(["Legendary", "Yes"]);
  if (!spawnCount && !pal.alphaLocations?.length) rows.push(["Spawn data", "Not imported for this Pal yet"]);
  return rows;
}

function displayPalNumber(pal: Pal) {
  return pal.paldeckNumber || pal.id.toString().padStart(3, "0");
}

function textOrUnknown(value: unknown) {
  return value === null || value === undefined ? "Information not currently available." : String(value);
}

function timeLabel(time: HabitatTime) {
  if (time === "day") return "Day";
  if (time === "night") return "Night";
  if (time === "unknown") return "Map spawns";
  return "Day/Night";
}

function SpawnMapPreview({ coordinates, totalMarkers }: { coordinates: { x: number; y: number }[]; totalMarkers?: number }) {
  const areas = spawnAreaGroups(coordinates);
  return (
    <div
      className="spawn-map"
      aria-label={`Palpagos Island spawn map preview with ${coordinates.length} imported spawn points`}
      data-spawn-count={totalMarkers || coordinates.length}
    >
      {areas.map((area, index) => (
        <span
          key={`${area.left}-${area.top}-${index}`}
          className="spawn-area"
          style={{
            left: `${area.left}%`,
            top: `${area.top}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            transform: `translate(-50%, -50%) rotate(${area.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function spawnAreaGroups(coordinates: { x: number; y: number }[]) {
  const points = coordinates.map(spawnMapPoint);
  const maxDistance = coordinates.length > 80 ? 5.4 : coordinates.length > 24 ? 7.2 : 9;
  const visited = new Set<number>();
  const groups: { left: number; top: number; width: number; height: number; rotation: number }[] = [];

  points.forEach((point, startIndex) => {
    if (visited.has(startIndex)) return;
    const queue = [startIndex];
    const cluster: { left: number; top: number }[] = [];
    visited.add(startIndex);

    while (queue.length) {
      const currentIndex = queue.shift()!;
      const current = points[currentIndex];
      cluster.push(current);
      points.forEach((candidate, candidateIndex) => {
        if (visited.has(candidateIndex)) return;
        if (distance(current, candidate) <= maxDistance) {
          visited.add(candidateIndex);
          queue.push(candidateIndex);
        }
      });
    }

    const leftValues = cluster.map((item) => item.left);
    const topValues = cluster.map((item) => item.top);
    const minLeft = Math.min(...leftValues);
    const maxLeft = Math.max(...leftValues);
    const minTop = Math.min(...topValues);
    const maxTop = Math.max(...topValues);
    const padding = cluster.length > 12 ? 3.4 : cluster.length > 3 ? 2.7 : 2.1;
    const width = Math.max(cluster.length > 1 ? maxLeft - minLeft + padding : 4.8, 4.8);
    const height = Math.max(cluster.length > 1 ? maxTop - minTop + padding : 4.8, 4.8);

    groups.push({
      left: clamp((minLeft + maxLeft) / 2, 0, 100),
      top: clamp((minTop + maxTop) / 2, 0, 100),
      width: clamp(width, 4.8, 34),
      height: clamp(height, 4.8, 34),
      rotation: ((groups.length % 7) - 3) * 6,
    });
  });

  return groups;
}

function spawnMapPoint(point: { x: number; y: number }) {
  const mapX = (point.y - 158000) / 459;
  const mapY = (point.x + 123888) / 459;
  const mapBounds = {
    left: -1954.07407407,
    right: 1200.26143791,
    top: 1245.7254902,
    bottom: -1908.61002179,
  };
  const left = ((mapX - mapBounds.left) / (mapBounds.right - mapBounds.left)) * 100;
  const top = ((mapBounds.top - mapY) / (mapBounds.top - mapBounds.bottom)) * 100;
  return {
    left: clamp(left, 0, 100),
    top: clamp(top, 0, 100),
  };
}

function distance(a: { left: number; top: number }, b: { left: number; top: number }) {
  return Math.hypot(a.left - b.left, a.top - b.top);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sameParents(a: number, b: number, selectedA: number, selectedB: number) {
  return (a === selectedA && b === selectedB) || (a === selectedB && b === selectedA);
}

function findPal(id: number) {
  return pals.find((pal) => pal.id === id);
}

function findResource(id: string) {
  return resources.find((resource) => resource.id === id);
}

function findLocation(id: string) {
  return locations.find((location) => location.id === id);
}

function randomPal() {
  return pals[Math.floor(Math.random() * pals.length)];
}

function ranchPals() {
  return pals
    .filter((pal) => pal.workSuitability.some((work) => work.type === "Farming"))
    .sort((a, b) => {
      const aLevel = a.workSuitability.find((work) => work.type === "Farming")?.level || 0;
      const bLevel = b.workSuitability.find((work) => work.type === "Farming")?.level || 0;
      return bLevel - aLevel || a.id - b.id;
    });
}

export default function App() {
  return (
    <CollectionProvider>
      <AppShell />
    </CollectionProvider>
  );
}
