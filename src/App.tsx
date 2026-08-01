import { useEffect, useMemo, useState } from "react";
import { CollectionProvider, useCollection } from "./collection";
import { pals, resources } from "./data";
import type { Pal, Resource, WorkSuitability } from "./types";

type Page = "dashboard" | "map" | "pals" | "breeding" | "work" | "ranch" | "items" | "technology" | "tools";
type ViewMode = "cards" | "list";
type TrackedState = {
  playerLevel: number;
  wantedTech: string[];
  unlockedTech: string[];
  craftedTech: string[];
  bossGoals: string[];
  notes: string;
};

const navItems: { page: Page; label: string; icon: string }[] = [
  { page: "dashboard", label: "Dashboard", icon: "home" },
  { page: "map", label: "Map", icon: "pin" },
  { page: "pals", label: "Pals", icon: "pal" },
  { page: "breeding", label: "Breeding", icon: "breed" },
  { page: "work", label: "Work Guide", icon: "work" },
  { page: "ranch", label: "Ranch", icon: "ranch" },
  { page: "items", label: "Items", icon: "bag" },
  { page: "technology", label: "Technology", icon: "tech" },
  { page: "tools", label: "Tools", icon: "tool" },
];

const workTypes = [
  "Kindling",
  "Watering",
  "Planting",
  "Generating Electricity",
  "Handiwork",
  "Gathering",
  "Lumbering",
  "Mining",
  "Medicine Production",
  "Cooling",
  "Transporting",
  "Farming",
];

const elementColor: Record<string, string> = {
  Neutral: "#c9c2be",
  Fire: "#ff7a30",
  Water: "#4eb8ff",
  Electric: "#ffd644",
  Grass: "#74d957",
  Ice: "#78e6f5",
  Dragon: "#a36dff",
  Dark: "#c64d9d",
  Ground: "#d18a45",
};

const elementGlyph: Record<string, string> = {
  Neutral: "◎",
  Fire: "🔥",
  Water: "💧",
  Electric: "⚡",
  Grass: "🌿",
  Ice: "❄",
  Dragon: "✦",
  Dark: "◉",
  Ground: "▲",
};

const workGlyph: Record<string, string> = {
  Kindling: "🔥",
  Watering: "💧",
  Planting: "🌱",
  "Generating Electricity": "⚡",
  Handiwork: "✋",
  Gathering: "♻",
  Lumbering: "▰",
  Mining: "⛏",
  "Medicine Production": "✚",
  Cooling: "❄",
  Transporting: "▣",
  Farming: "🌾",
};

const mapFilters = [
  ["Recommended Level", "◎"],
  ["Pal Spawns", "🐾"],
  ["Alpha Pals", "♛"],
  ["Dungeons", "◉"],
  ["Fast Travel", "✦"],
  ["Towers", "▥"],
  ["Syndicate Camps", "⚔"],
  ["Merchants", "◆"],
  ["Black Marketeers", "☠"],
  ["Lifmunk Effigies", "☘"],
  ["Treasure Chests", "▣"],
  ["Skill Fruit Trees", "✤"],
  ["Ore", "●"],
  ["Coal", "◒"],
  ["Sulfur", "♦"],
  ["Quartz", "◇"],
  ["Crude Oil", "◈"],
  ["Meteor Locations", "✹"],
  ["Wildlife Sanctuaries", "☘"],
];

const technologies = [
  { id: "watchtower", level: 31, type: "Structures", name: "Watchtower", cost: 2, materials: ["Wood", "Stone"], ancient: false },
  { id: "grenade", level: 31, type: "Items", name: "Grenade", cost: 2, materials: ["Fiber", "Gunpowder"], ancient: false },
  { id: "breeding-farm", level: 31, type: "Utilities", name: "Breeding Farm", cost: 2, materials: ["Wood", "Stone", "Cake"], ancient: false },
  { id: "production-line", level: 32, type: "Structures", name: "Production Assembly Line", cost: 2, materials: ["Refined Ingot", "Circuit Board", "Gear", "High Quality Pal Oil"], ancient: false },
  { id: "refined-pickaxe", level: 32, type: "Items", name: "Refined Metal Pickaxe", cost: 2, materials: ["Refined Ingot", "Wood", "Stone"], ancient: false },
  { id: "advanced-saddle", level: 32, type: "Items", name: "Advanced Pal Saddle", cost: 2, materials: ["Leather", "Ingot", "Cloth"], ancient: false },
  { id: "helezephyr", level: 32, type: "Pals", name: "Helzephyr Saddle", cost: 2, materials: ["Leather", "Fiber", "Paldium"], ancient: false },
  { id: "plasma-cannon", level: 32, type: "Ancient Technology", name: "Plasma Cannon", cost: 3, materials: ["Ancient Civilization Parts", "Circuit Board"], ancient: true },
  { id: "electric-furnace", level: 33, type: "Structures", name: "Electric Furnace", cost: 3, materials: ["Refined Ingot", "Circuit Board"], ancient: false },
  { id: "laser-rifle", level: 33, type: "Weapons", name: "Laser Rifle", cost: 3, materials: ["Refined Ingot", "Polymer"], ancient: false },
  { id: "jormuntide", level: 33, type: "Pals", name: "Jormuntide Saddle", cost: 2, materials: ["Leather", "Fiber", "Water Organ"], ancient: false },
  { id: "ultra-grapple", level: 33, type: "Ancient Technology", name: "Ultra Grappling Gun", cost: 4, materials: ["Ancient Civilization Parts", "Carbon Fiber"], ancient: true },
  { id: "power-generator", level: 34, type: "Structures", name: "Power Generator", cost: 3, materials: ["Ingot", "Electric Organ"], ancient: false },
  { id: "frostallion", level: 34, type: "Pals", name: "Frostallion Saddle", cost: 4, materials: ["Leather", "Ice Organ", "Paldium"], ancient: false },
];

const foods = [
  { name: "Legendary Steak", rarity: "Legendary", type: "Combat", nutrition: 420, buffs: ["Attack +35%", "Defense +25%", "Work Speed +15%"], station: "High Quality Cooking Pot", owned: true },
  { name: "Jormuntide's Seafood Platter", rarity: "Legendary", type: "Combat", nutrition: 350, buffs: ["Attack +30%", "Defense +20%", "Work Speed +20%"], station: "High Quality Cooking Pot", owned: false },
  { name: "Cake", rarity: "Epic", type: "Base", nutrition: 300, buffs: ["Work Speed +50%", "SAN +20%"], station: "Cooking Pot", owned: true },
  { name: "Mushroom Pizza", rarity: "Rare", type: "Stamina", nutrition: 220, buffs: ["Stamina Regen +30%", "Move Speed +15%"], station: "Cooking Pot", owned: true },
  { name: "Hot Spring Soup", rarity: "Rare", type: "HP", nutrition: 200, buffs: ["Max HP +25%", "SAN +10%"], station: "Cooking Pot", owned: false },
  { name: "Jam-filled Bun", rarity: "Uncommon", type: "Stamina", nutrition: 120, buffs: ["Stamina +15%"], station: "Cooking Pot", owned: true },
  { name: "Red Berries", rarity: "Common", type: "Base", nutrition: 45, buffs: ["Work Speed +10%"], station: "Campfire", owned: true },
];

const defaultTracking: TrackedState = {
  playerLevel: 32,
  wantedTech: ["production-line", "advanced-saddle", "helezephyr", "plasma-cannon"],
  unlockedTech: ["watchtower", "grenade", "breeding-farm"],
  craftedTech: ["watchtower"],
  bossGoals: ["Zoe & Grizzbolt", "Lily & Lyleen"],
  notes: "",
};

const mapMarkers = [
  { id: 1, x: 58, y: 54, type: ["Pal Spawns", "🐾"], level: 12, name: "Windswept Hills" },
  { id: 2, x: 42, y: 46, type: ["Fast Travel", "✦"], level: 18, name: "Small Settlement" },
  { id: 3, x: 32, y: 36, type: ["Dungeons", "◉"], level: 23, name: "Hillside Cavern" },
  { id: 4, x: 28, y: 65, type: ["Ore", "●"], level: 25, name: "Ore Field" },
  { id: 5, x: 48, y: 72, type: ["Merchants", "◆"], level: 28, name: "Trading Post" },
  { id: 6, x: 66, y: 38, type: ["Alpha Pals", "♛"], level: 31, name: "Alpha Den" },
  { id: 7, x: 73, y: 62, type: ["Towers", "▥"], level: 35, name: "Tower Approach" },
  { id: 8, x: 18, y: 78, type: ["Sulfur", "♦"], level: 42, name: "Volcanic Sulfur" },
  { id: 9, x: 24, y: 22, type: ["Coal", "◒"], level: 45, name: "Frostbound Coal" },
  { id: 10, x: 81, y: 25, type: ["Wildlife Sanctuaries", "☘"], level: 50, name: "Sanctuary Coast" },
];

function AppShell() {
  const [page, setPage] = useState<Page>(() => parsePage());
  const [tracking, setTracking] = useStoredState<TrackedState>("palworld-companion.tracking.v2", defaultTracking);

  useEffect(() => {
    const onHash = () => setPage(parsePage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function updateTracking(next: Partial<TrackedState>) {
    setTracking({ ...tracking, ...next });
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} />
      <div className="workspace">
        <Topbar tracking={tracking} updateTracking={updateTracking} />
        <main>
          {page === "dashboard" && <Dashboard tracking={tracking} updateTracking={updateTracking} />}
          {page === "map" && <MapPage tracking={tracking} />}
          {page === "pals" && <PalsPage tracking={tracking} />}
          {page === "breeding" && <BreedingPage tracking={tracking} />}
          {page === "work" && <WorkPage tracking={tracking} />}
          {page === "ranch" && <RanchPage tracking={tracking} />}
          {page === "items" && <ItemsPage tracking={tracking} />}
          {page === "technology" && <TechnologyPage tracking={tracking} updateTracking={updateTracking} />}
          {page === "tools" && <ToolsPage tracking={tracking} updateTracking={updateTracking} />}
        </main>
      </div>
      <MobileNav page={page} />
    </div>
  );
}

function Sidebar({ page }: { page: Page }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#/dashboard">
        <img src="palworld-logo.png" alt="Palworld Companion" />
      </a>
      <nav aria-label="Main navigation">
        {navItems.map((item) => (
          <a className={item.page === page ? "active" : ""} href={`#/${item.page}`} key={item.page}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <section className="trainer-card">
        <div className="trainer-avatar">PT</div>
        <div>
          <strong>Pal Tamer</strong>
          <small>Local progress saved</small>
        </div>
      </section>
    </aside>
  );
}

function Topbar({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const palMatches = normalized ? pals.filter((pal) => pal.name.toLowerCase().includes(normalized)).slice(0, 5) : [];
  const itemMatches = normalized ? resources.filter((item) => item.name.toLowerCase().includes(normalized)).slice(0, 5) : [];
  const levelPercent = Math.min(99, Math.round((tracking.playerLevel / 60) * 100));

  return (
    <header className="topbar">
      <button className="icon-button menu-button" aria-label="Open menu"><Icon name="menu" /></button>
      <div className="searchbox">
        <Icon name="search" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pals, Items, Locations..." aria-label="Search Pals, Items, Locations" />
        <kbd>/</kbd>
        {normalized && (
          <div className="search-popover">
            <strong>Pals</strong>
            {palMatches.length ? palMatches.map((pal) => <a href="#/pals" key={pal.id}>{pal.name}</a>) : <span>No Pal matches</span>}
            <strong>Items</strong>
            {itemMatches.length ? itemMatches.map((item) => <a href="#/items" key={item.id}>{item.name}</a>) : <span>No item matches</span>}
          </div>
        )}
      </div>
      <label className="level-control">
        <span>Player Level</span>
        <strong>Lv. {tracking.playerLevel}</strong>
        <input type="range" min="1" max="60" value={tracking.playerLevel} onChange={(event) => updateTracking({ playerLevel: Number(event.target.value) })} />
        <small>{levelPercent}%</small>
      </label>
      <button className="icon-button" aria-label="Theme"><Icon name="moon" /></button>
      <button className="icon-button" aria-label="Notifications"><Icon name="bell" /></button>
      <div className="profile-pill"><span>PT</span><strong>Pal Tamer</strong></div>
    </header>
  );
}

function Dashboard({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  const { collection } = useCollection();
  const currentUnlocks = technologies.filter((tech) => tech.level === tracking.playerLevel || tech.level === tracking.playerLevel + 1);
  const recentlyViewed = pals.filter((pal) => collection.recentlyViewedPalIds.includes(pal.id)).slice(0, 4);
  const favourites = pals.filter((pal) => collection.favouritePalIds.includes(pal.id)).slice(0, 6);
  const featured = findPalByName("Anubis") || pals[0];

  return (
    <div className="dashboard-grid">
      <section className="panel update-panel">
        <header className="section-title"><span>Game Update</span><Badge>New</Badge></header>
        <div>
          <h1>v0.3.2 Patch Notes</h1>
          <p>New Pals, a stronger automation path, quality-of-life settings, balance tuning, and fresh crafting targets for mid-game bases.</p>
          <a className="button-link" href="https://store.steampowered.com/news/app/1623730" target="_blank" rel="noreferrer">View Patch Notes</a>
        </div>
        <img src={featured.image} alt="" />
      </section>

      <section className="panel map-preview">
        <header className="section-title"><span>Map Preview</span><a href="#/map">Open Full Map</a></header>
        <MiniMap tracking={tracking} />
      </section>

      <LevelPanel tracking={tracking} updateTracking={updateTracking} />
      <MetricPanel label="Game Version" value="v0.3.2.0" detail="You're up to date" tone="success" />

      <section className="panel update-summary">
        <header className="section-title"><span>Current Update Summary</span></header>
        <UpdateTile title="Patch Notes" detail="Latest official update link is in the game update card." />
        <UpdateTile title="Data Set" detail={`${pals.length} Pals and ${resources.length} items imported into this companion.`} />
        <UpdateTile title="Tracking" detail="Owned Pals, favourites, tech status, notes and goals save locally." />
        <UpdateTile title="Next Focus" detail={`Your level is set to ${tracking.playerLevel}, so unlock lists and map filters use that level.`} />
      </section>

      <section className="panel level-now">
        <header className="section-title"><span>At Your Level ({tracking.playerLevel})</span></header>
        <MiniUnlocks title="New Pals Available" items={pals.slice(95, 103).map((pal) => ({ label: pal.name, image: pal.image }))} />
        <MiniUnlocks title="New Recipes" items={resources.slice(0, 6).map((item) => ({ label: item.name, image: item.image }))} />
        <MiniUnlocks title="New Technologies" items={currentUnlocks.map((tech) => ({ label: tech.name }))} />
      </section>

      <section className="panel compact-list">
        <header className="section-title"><span>Recently Viewed</span></header>
        {(recentlyViewed.length ? recentlyViewed : pals.slice(180, 183)).map((pal) => <MiniPalRow pal={pal} key={pal.id} />)}
      </section>

      <section className="panel compact-list">
        <header className="section-title"><span>Favourites</span></header>
        {(favourites.length ? favourites : pals.slice(205, 211)).map((pal) => <MiniPalRow pal={pal} key={pal.id} />)}
      </section>

      <GoalsPanel tracking={tracking} updateTracking={updateTracking} />
      <FeaturedPal pal={featured} />
      <TrackerSummary tracking={tracking} />
      <QuickLinks />
      <section className="tech-strip">
        <strong>Upcoming Technology Unlocks</strong>
        {technologies.filter((tech) => tech.level > tracking.playerLevel).slice(0, 6).map((tech) => (
          <span key={tech.id}>Lv. {tech.level} {tech.name}</span>
        ))}
      </section>
    </div>
  );
}

function MapPage({ tracking }: { tracking: TrackedState }) {
  const [selected, setSelected] = useState(mapFilters.map(([label]) => label));
  const [onlyLevel, setOnlyLevel] = useState(true);
  const [region, setRegion] = useState("Windswept Hills");
  const visibleMarkers = mapMarkers.filter((marker) => selected.includes(marker.type[0]) && (!onlyLevel || marker.level <= tracking.playerLevel + 8));
  const regions = ["Windswept Hills", "Frostbound Mountains", "Desolate Volcano", "Bamboo Groves", "Moonless Shore", "Deep Sea Fortress"];

  function toggleFilter(label: string) {
    setSelected((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
  }

  return (
    <div className="page-grid map-layout">
      <aside className="panel filters">
        <header className="section-title"><span>Map Filters</span><button onClick={() => setSelected(selected.length ? [] : mapFilters.map(([label]) => label))}>{selected.length ? "Hide All" : "Show All"}</button></header>
        <label className="switch-row"><span>Show content available at my level (Lv. {tracking.playerLevel})</span><input type="checkbox" checked={onlyLevel} onChange={(event) => setOnlyLevel(event.target.checked)} /></label>
        <div className="range-row"><span>Level Range</span><strong>1 - {onlyLevel ? tracking.playerLevel + 8 : 60}</strong></div>
        {mapFilters.map(([label, glyph]) => (
          <label className="check-row" key={label}>
            <span><b>{glyph}</b>{label}</span>
            <input type="checkbox" checked={selected.includes(label)} onChange={() => toggleFilter(label)} />
          </label>
        ))}
      </aside>
      <section className="panel full-map-panel">
        <div className="map-tabs">
          {["Palpagos Islands", "Sakurajima", "Feybreak Island"].map((tab) => <button className={tab === "Palpagos Islands" ? "active" : ""} key={tab}>{tab}</button>)}
          <input placeholder="Search locations..." aria-label="Search locations" />
        </div>
        <div className="world-map">
          <img src="level-map-guide.png" alt="Palpagos Island map" />
          {visibleMarkers.map((marker) => (
            <button
              className="map-marker"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              key={marker.id}
              title={`${marker.name}: ${marker.type[0]} Lv. ${marker.level}`}
              onClick={() => setRegion(regions[marker.id % regions.length])}
            >
              <span />
            </button>
          ))}
          <div className="map-controls"><button>+</button><button>-</button><button>◎</button><button>▣</button></div>
          <span className="coords">X: 1532&nbsp;&nbsp;Y: -244</span>
          <span className="zoom">100%</span>
        </div>
      </section>
      <aside className="panel region-panel">
        <h2>{region}</h2>
        <strong className="green">Recommended Level: 15 - 25</strong>
        <img src="level-map-guide.png" alt="" />
        <p>A large open area with rolling hills, ruins, resource nodes, and reliable early-to-mid game Pal spawns.</p>
        <InfoList rows={[["Pal Spawns", "12"], ["Alpha Pals", "1"], ["Dungeons", "1"], ["Fast Travel", "2"], ["Treasure Chests", "8"], ["Ore Nodes", "6"], ["Coal Nodes", "3"]]} />
        <button>Set as Waypoint</button>
      </aside>
      <section className="panel location-rail"><header className="section-title"><span>Recently Viewed Locations</span></header>{regions.slice(0, 5).map((name) => <button key={name}>{name}<small>Lv. 15 - 55</small></button>)}</section>
    </div>
  );
}

function PalsPage({ tracking }: { tracking: TrackedState }) {
  const { isOwned, isFavourite, toggleOwned, toggleFavourite, markViewed } = useCollection();
  const [query, setQuery] = useState("");
  const [element, setElement] = useState("All");
  const [work, setWork] = useState("All");
  const [owned, setOwned] = useState("Any");
  const [view, setView] = useState<ViewMode>("cards");
  const filtered = useMemo(() => pals.filter((pal) => {
    const haystack = `${pal.name} ${pal.paldeckNumber || pal.id} ${pal.elements.join(" ")} ${pal.workSuitability.map((item) => item.type).join(" ")}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (element === "All" || pal.elements.includes(element))
      && (work === "All" || pal.workSuitability.some((item) => item.type === work))
      && (owned === "Any" || (owned === "Owned" ? isOwned(pal.id) : !isOwned(pal.id)));
  }).slice(0, 40), [query, element, work, owned, isOwned]);
  const selected = filtered[0] || pals[0];

  return (
    <div className="page-grid pal-layout">
      <aside className="panel filters">
        <header className="section-title"><span>Pals Database</span><strong>{pals.length}</strong></header>
        {["All Pals", "Owned", "Favourites", "Not Owned", "Boss Pals", "Alpha Pals", "Mounts", "Ranch Pals"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}<span>{index === 0 ? pals.length : Math.max(8, 92 - index * 7)}</span></button>)}
        <hr />
        <h3>Element</h3>
        {unique(pals.flatMap((pal) => pal.elements)).map((item) => <button key={item} onClick={() => setElement(item)}>{elementGlyph[item] || "•"} {item}<span>{pals.filter((pal) => pal.elements.includes(item)).length}</span></button>)}
      </aside>
      <section className="panel pal-browser">
        <header className="page-heading"><div><h1>Pals</h1><span>{filtered.length} shown from {pals.length} total</span></div><div className="segmented"><button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>▦</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷</button></div></header>
        <div className="toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or Paldeck #..." />
          <select value={element} onChange={(event) => setElement(event.target.value)}><option>All</option>{unique(pals.flatMap((pal) => pal.elements)).map((item) => <option key={item}>{item}</option>)}</select>
          <select value={work} onChange={(event) => setWork(event.target.value)}><option>All</option>{workTypes.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={owned} onChange={(event) => setOwned(event.target.value)}><option>Any</option><option>Owned</option><option>Not Owned</option></select>
        </div>
        <div className={view === "cards" ? "pal-card-grid" : "pal-list-view"}>
          {filtered.map((pal) => (
            <article className="pal-card" key={pal.id} onMouseEnter={() => markViewed(pal.id)}>
              <button className={`favorite ${isFavourite(pal.id) ? "active" : ""}`} onClick={() => toggleFavourite(pal.id)} aria-label={`Favourite ${pal.name}`}>★</button>
              <img src={pal.image} alt={pal.name} />
              <strong>#{displayNumber(pal)} {pal.name}</strong>
              <ElementChips elements={pal.elements} />
              <WorkDots work={pal.workSuitability} />
              <div className="card-actions"><button onClick={() => toggleOwned(pal.id)}>{isOwned(pal.id) ? "Owned" : "Mark Owned"}</button><button>Details</button></div>
            </article>
          ))}
        </div>
      </section>
      <aside className="panel detail-panel">
        <PalDetail pal={selected} tracking={tracking} />
      </aside>
    </div>
  );
}

function BreedingPage({ tracking }: { tracking: TrackedState }) {
  const [parentA, setParentA] = useState(findPalByName("Jormuntide")?.id || pals[0].id);
  const [parentB, setParentB] = useState(findPalByName("Relaxaurus")?.id || pals[1].id);
  const a = findPal(parentA) || pals[0];
  const b = findPal(parentB) || pals[1];
  const target = findPalByName("Jormuntide Ignis") || findPalByName("Suzaku") || pals[2];
  const combos = [
    [a, findPalByName("Suzaku") || b, target, "100%"],
    [a, findPalByName("Blazehowl") || b, target, "95%"],
    [findPalByName("Relaxaurus Lux") || b, findPalByName("Suzaku") || a, target, "90%"],
  ];

  return (
    <div className="page-grid breeding-layout">
      <aside className="panel filters">
        <header className="section-title"><span>Breeding Tools</span></header>
        {["Breeding Calculator", "Breeding Chain Planner", "Reverse Breeding", "Passive Inheritance", "Egg Types Guide"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}</button>)}
        <hr />
        <label className="switch-row"><span>Use only owned Pals</span><input type="checkbox" defaultChecked /></label>
        <label>Max Parent Level <strong>{Math.min(40, tracking.playerLevel + 8)}</strong><input type="range" min="1" max="60" defaultValue={Math.min(40, tracking.playerLevel + 8)} /></label>
      </aside>
      <section className="panel breeding-main">
        <header className="page-heading"><div><h1>Breeding Calculator</h1><span>Find the best ways to breed any Pal.</span></div></header>
        <div className="parents">
          <PalPicker label="Parent 1" value={parentA} onChange={setParentA} />
          <div className="heart">♡</div>
          <PalPicker label="Parent 2" value={parentB} onChange={setParentB} />
          <div className="egg-result"><span>Egg Result</span><div className="egg">◒</div><strong>Large Damp Egg</strong><small>01:20:00</small></div>
        </div>
        <div className="tabs">{["Best Combinations", "Fastest Path", "Easiest Path", "Uses Owned Pals", "Lowest Level Parents"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}</button>)}</div>
        <div className="combo-list">
          {combos.map(([left, right, child, rate], index) => <BreedingCombo key={index} index={index + 1} left={left as Pal} right={right as Pal} child={child as Pal} rate={rate as string} />)}
        </div>
      </section>
      <aside className="panel detail-panel"><PalDetail pal={target} tracking={tracking} /></aside>
    </div>
  );
}

function WorkPage({ tracking }: { tracking: TrackedState }) {
  const [workType, setWorkType] = useState("All Jobs");
  const ranked = [...pals].filter((pal) => workType === "All Jobs" || pal.workSuitability.some((work) => work.type === workType)).sort((a, b) => workScore(b, workType) - workScore(a, workType)).slice(0, 10);
  const top = ranked[0] || pals[0];

  return (
    <div className="page-grid work-layout">
      <aside className="panel filters">
        <h2>Work Guide</h2>
        <p>Find the best Pals for every job and task.</p>
        <label className="switch-row"><span>Show only available at my level</span><input type="checkbox" defaultChecked /></label>
        <select><option>Lv. 2 or higher</option><option>Any work level</option></select>
      </aside>
      <section className="panel table-panel">
        <header className="page-heading"><div><h1>Work Suitability Guide</h1><span>{ranked.length} top workers for Lv. {tracking.playerLevel}</span></div><button>Export Table</button></header>
        <div className="work-tabs">{["All Jobs", ...workTypes].map((item) => <button className={workType === item ? "active" : ""} onClick={() => setWorkType(item)} key={item}>{workGlyph[item] || "▦"}<span>{shortWork(item)}</span></button>)}</div>
        <div className="data-table">
          <div className="table-head"><span>Pal</span><span>Element</span><span>Work Suitability</span><span>Score</span><span>Available</span></div>
          {ranked.map((pal, index) => <WorkRow pal={pal} index={index + 1} key={pal.id} />)}
        </div>
      </section>
      <aside className="panel detail-panel"><PalDetail pal={top} tracking={tracking} /><InsightCards top={top} /></aside>
    </div>
  );
}

function RanchPage({ tracking }: { tracking: TrackedState }) {
  const ranchers = pals.filter((pal) => pal.workSuitability.some((work) => work.type === "Farming")).sort((a, b) => workScore(b, "Farming") - workScore(a, "Farming")).slice(0, 12);
  const selected = ranchers[0] || pals[0];
  return (
    <div className="page-grid ranch-layout">
      <aside className="panel filters">
        <h2>Ranch Guide</h2>
        <p>Best Ranch Pals and passive item production.</p>
        <input placeholder="Search items..." />
        <select><option>All Items</option><option>Eggs</option><option>Milk</option><option>Wool</option><option>Honey</option></select>
        <label className="switch-row"><span>Show only available at my level</span><input type="checkbox" defaultChecked /></label>
      </aside>
      <section className="panel table-panel">
        <header className="page-heading"><div><h1>Ranch Pals</h1><span>Pals that can be assigned to Ranches.</span></div><button>Ranch Items Overview</button></header>
        <div className="tabs">{["All Items", "Eggs", "Milk", "Wool", "Honey", "Leather", "Bones", "Pal Fluids", "Oils"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}</button>)}</div>
        <div className="data-table">
          <div className="table-head ranch-head"><span>Pal</span><span>Element</span><span>Item Produced</span><span>Amount</span><span>Drop Rate</span><span>Owned</span></div>
          {ranchers.map((pal, index) => <RanchRow pal={pal} index={index + 1} key={pal.id} />)}
        </div>
      </section>
      <aside className="panel detail-panel"><PalDetail pal={selected} tracking={tracking} /><RanchProduction pal={selected} /></aside>
    </div>
  );
}

function ItemsPage({ tracking }: { tracking: TrackedState }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<ViewMode>("cards");
  const categories = unique(resources.map((item) => item.category)).slice(0, 14);
  const filtered = resources.filter((item) => (!query || item.name.toLowerCase().includes(query.toLowerCase()) || item.description?.toLowerCase().includes(query.toLowerCase())) && (category === "All" || item.category === category)).slice(0, 36);
  const selected = filtered[0] || resources[0];
  return (
    <div className="page-grid items-layout">
      <aside className="panel filters">
        <header className="section-title"><span>Items Database</span><strong>{resources.length}</strong></header>
        {["All Items", "Weapons", "Armour", "Ammo", "Materials", "Food", "Medicine", "Building Materials", "Key Items", "Other"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}<span>{index === 0 ? resources.length : Math.max(24, 224 - index * 20)}</span></button>)}
        <hr />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </aside>
      <section className="panel item-browser">
        <header className="page-heading"><div><h1>All Items</h1><span>{filtered.length} items shown for Lv. {tracking.playerLevel}</span></div><div className="segmented"><button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>▦</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☷</button></div></header>
        <div className="tabs">{["All Items", "Crafted", "Pal Drop", "Ranch Drop", "Mined", "Gathered", "Purchased", "Boss Drop", "Chest Loot", "Quest Reward"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}</button>)}</div>
        <div className={view === "cards" ? "item-grid" : "item-list-view"}>
          {filtered.map((item) => <ItemCard item={item} key={item.id} />)}
        </div>
      </section>
      <aside className="panel item-detail"><ItemDetail item={selected} /></aside>
    </div>
  );
}

function TechnologyPage({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  const [filter, setFilter] = useState("All");
  const techs = technologies.filter((tech) => filter === "All" || (filter === "Ancient" ? tech.ancient : !tech.ancient));
  function toggleList(key: "wantedTech" | "unlockedTech" | "craftedTech", id: string) {
    const list = tracking[key];
    updateTracking({ [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id] });
  }
  const selected = techs.find((tech) => tracking.wantedTech.includes(tech.id)) || techs[0];

  return (
    <div className="page-grid tech-layout">
      <aside className="panel filters">
        <h2>Technology Overview</h2>
        <Progress label="Technologies Unlocked" value={tracking.unlockedTech.length} max={142} />
        <Progress label="Ancient Technologies Unlocked" value={tracking.unlockedTech.filter((id) => technologies.find((tech) => tech.id === id)?.ancient).length} max={50} />
        <div className="segmented three"><button className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}>All</button><button className={filter === "Primitive" ? "active" : ""} onClick={() => setFilter("Primitive")}>Primitive</button><button className={filter === "Ancient" ? "active" : ""} onClick={() => setFilter("Ancient")}>Ancient</button></div>
        <InfoList rows={[["Wanted", tracking.wantedTech.length.toString()], ["Unlocked", tracking.unlockedTech.length.toString()], ["Crafted", tracking.craftedTech.length.toString()]]} />
      </aside>
      <section className="panel tech-tree">
        <header className="page-heading"><div><h1>Technology Tree</h1><span>Unlock recipes, structures, items, and abilities.</span></div><div className="points"><span>Technology Points <strong>12</strong></span><span>Ancient Points <strong>3</strong></span></div></header>
        <div className="tech-levels">
          {[31, 32, 33, 34].map((level) => (
            <div className={`tech-row level-${level === tracking.playerLevel ? "current" : "normal"}`} key={level}>
              <strong className="level-badge">{level}</strong>
              <div className="tech-cards">
                {techs.filter((tech) => tech.level === level).map((tech) => (
                  <article className={`tech-card ${tech.ancient ? "ancient" : ""} ${tracking.unlockedTech.includes(tech.id) ? "unlocked" : ""} ${level > tracking.playerLevel ? "locked" : ""}`} key={tech.id}>
                    <span>{tech.type}</span>
                    <strong>{tech.name}</strong>
                    <small>{tech.cost} {tech.ancient ? "Ancient" : "Tech"} pts</small>
                    <div className="mini-actions">
                      <button onClick={() => toggleList("wantedTech", tech.id)} className={tracking.wantedTech.includes(tech.id) ? "active" : ""}>★</button>
                      <button onClick={() => toggleList("unlockedTech", tech.id)} className={tracking.unlockedTech.includes(tech.id) ? "active" : ""}>✓</button>
                      <button onClick={() => toggleList("craftedTech", tech.id)} className={tracking.craftedTech.includes(tech.id) ? "active" : ""}>⚒</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <aside className="panel tech-detail">
        <h2>{selected.name}</h2>
        <Badge>{selected.type}</Badge>
        <InfoList rows={[["Unlock Level", `Lv. ${selected.level}`], ["Technology Points", selected.cost.toString()], ["Status", tracking.unlockedTech.includes(selected.id) ? "Unlocked" : "Wanted"]]} />
        <h3>Requirements</h3>
        {selected.materials.map((item, index) => <div className="material-row" key={item}><span>{item}</span><strong>{index % 2 ? "12 / 10" : "15 / 20"}</strong></div>)}
        <div className="warning-box"><strong>Missing Technology Points</strong><p>You need 2 more Technology Points.</p><button>Show How to Earn Points</button></div>
      </aside>
    </div>
  );
}

function ToolsPage({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  return (
    <div className="tools-page">
      <section className="panel page-heading tools-heading"><div><h1>Tools</h1><span>Planning helpers for your party, captures, resources, bosses, dungeons, passives, and food.</span></div></section>
      <div className="tool-grid">
        <ToolCard title="Party Builder" detail="Analyse element coverage, mounts, and utility gaps." content={<PartyMini />} />
        <ToolCard title="Capture Advisor" detail="Best upgrades based on your current level." content={<CaptureAdvisor tracking={tracking} />} />
        <ToolCard title="Resource Calculator" detail="Nested material estimates and farming sources." content={<ResourceMini />} />
        <ToolCard title="Mount Comparison" detail="Compare flying, ground, and water mounts." content={<MountMini />} />
        <ToolCard title="Boss Guide" detail="Recommended party, weaknesses, rewards, and timers." content={<BossMini tracking={tracking} updateTracking={updateTracking} />} />
        <ToolCard title="Food Guide" detail="Recipes, buffs, nutrition, and ingredients." content={<FoodGuide />} wide />
      </div>
    </div>
  );
}

function FoodGuide() {
  return (
    <div className="food-guide">
      <div className="tabs">{["All", "Best Overall", "Combat", "Base Workers", "Stamina", "HP"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}</button>)}</div>
      <div className="food-table">
        {foods.map((food, index) => (
          <div className="food-row" key={food.name}>
            <strong>{index + 1}</strong>
            <div><b>{food.name}</b><small>{food.rarity}</small></div>
            <span>{food.type}</span>
            <span>{food.buffs.join(", ")}</span>
            <b>{food.nutrition}</b>
            <span>{food.station}</span>
            <span className={food.owned ? "green" : "muted"}>{food.owned ? "Owned" : "Missing"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsPanel({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  const goals = [
    ["Capture 5 Pals", "3 / 5"],
    ["Build Advanced Base", "0 / 1"],
    ["Defeat Collected Bosses", "12 / 24"],
    ["Unlock Wanted Tech", `${tracking.unlockedTech.filter((id) => tracking.wantedTech.includes(id)).length} / ${tracking.wantedTech.length}`],
  ];
  return (
    <section className="panel goals-panel">
      <header className="section-title"><span>Goals</span></header>
      {goals.map(([label, progress]) => <div className="goal-row" key={label}><span>{label}</span><strong>{progress}</strong></div>)}
      <textarea value={tracking.notes} onChange={(event) => updateTracking({ notes: event.target.value })} placeholder="Personal notes..." aria-label="Personal notes" />
    </section>
  );
}

function TrackerSummary({ tracking }: { tracking: TrackedState }) {
  const { collection } = useCollection();
  const owned = collection.ownedPalIds.length;
  const progress = Math.round(((owned / Math.max(1, pals.length)) * 0.45 + (tracking.unlockedTech.length / 142) * 0.35 + (tracking.craftedTech.length / 70) * 0.2) * 100);
  return (
    <section className="panel tracker-summary">
      <header className="section-title"><span>Tracker Summary</span></header>
      <div className="donut" style={{ "--progress": `${progress}%` } as React.CSSProperties}><strong>{progress}%</strong><span>Overall Progress</span></div>
      <InfoList rows={[["Pals Owned", `${owned} / ${pals.length}`], ["Technologies", `${tracking.unlockedTech.length} / 142`], ["Items Collected", "318 / 570"], ["Bosses Defeated", "12 / 24"]]} />
    </section>
  );
}

function QuickLinks() {
  return (
    <section className="panel quick-links">
      <header className="section-title"><span>Quick Links</span></header>
      {navItems.slice(2).map((item) => <a href={`#/${item.page}`} key={item.page}><Icon name={item.icon} />{item.label}</a>)}
    </section>
  );
}

function FeaturedPal({ pal }: { pal: Pal }) {
  return <section className="panel featured-pal"><PalDetail pal={pal} /></section>;
}

function PalDetail({ pal }: { pal: Pal; tracking?: TrackedState }) {
  const { isOwned, toggleOwned, isFavourite, toggleFavourite } = useCollection();
  const bestWork = highestWork(pal);
  return (
    <div className="pal-detail">
      <div className="detail-art"><img src={pal.image} alt={pal.name} /></div>
      <div className="detail-copy">
        <span>#{displayNumber(pal)}</span>
        <h2>{pal.name}</h2>
        <ElementChips elements={pal.elements} />
        <div className="pill-row">{hasMount(pal) && <Badge>Mount</Badge>}{isRanchPal(pal) && <Badge>Ranch</Badge>}{pal.alpha && <Badge>Alpha</Badge>}{pal.legendary && <Badge>Legendary</Badge>}{isOwned(pal.id) && <Badge>Owned</Badge>}</div>
        <h3>{pal.partnerSkill?.name || "Partner Skill"}</h3>
        <p>{cleanSkill(pal.partnerSkill?.description || pal.description || "Information is still being investigated.")}</p>
        <h3>Work Suitability</h3>
        <WorkDots work={pal.workSuitability} labelled />
        <InfoList rows={[["Best Work", bestWork ? `${bestWork.type} Lv. ${bestWork.level}` : "None"], ["Drops", pal.possibleDrops.length.toString()], ["Spawn Entries", pal.habitats.length.toString()]]} />
        <div className="card-actions"><button onClick={() => toggleOwned(pal.id)}>{isOwned(pal.id) ? "Remove Owned" : "Mark Owned"}</button><button onClick={() => toggleFavourite(pal.id)}>{isFavourite(pal.id) ? "Unfavourite" : "Favourite"}</button></div>
      </div>
    </div>
  );
}

function MiniMap({ tracking }: { tracking: TrackedState }) {
  const markers = mapMarkers.filter((marker) => marker.level <= tracking.playerLevel + 8).slice(0, 4);
  return (
    <div className="mini-map">
      <img src="level-map-guide.png" alt="" />
      {markers.map((marker) => (
        <span className="map-dot labelled-dot" style={{ left: `${marker.x}%`, top: `${marker.y}%` }} key={marker.id}>
          <i />
          <b>{marker.name}</b>
        </span>
      ))}
    </div>
  );
}

function MetricPanel({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "success" }) {
  return <section className="panel metric-panel"><span>{label}</span><strong>{value}</strong><small className={tone === "success" ? "green" : ""}>{detail}</small></section>;
}

function LevelPanel({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  function setLevel(value: number) {
    updateTracking({ playerLevel: Math.max(1, Math.min(60, Number.isFinite(value) ? Math.round(value) : 1)) });
  }

  return (
    <section className="panel level-panel">
      <header className="section-title"><span>My Player Level</span></header>
      <div className="level-editor">
        <label>
          <span>Level</span>
          <input type="number" min="1" max="60" value={tracking.playerLevel} onChange={(event) => setLevel(Number(event.target.value))} />
        </label>
        <input type="range" min="1" max="60" value={tracking.playerLevel} onChange={(event) => setLevel(Number(event.target.value))} aria-label="Player level" />
      </div>
      <p>Used for map availability, unlocks, breeding filters, tools, and dashboard recommendations.</p>
    </section>
  );
}

function UpdateTile({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="update-tile">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function MiniUnlocks({ title, items }: { title: string; items: { label: string; image?: string }[] }) {
  return <div className="mini-unlocks"><h3>{title}</h3><div>{items.slice(0, 6).map((item) => <span key={item.label}>{item.image ? <img src={item.image} alt="" /> : "▣"}<small>{item.label}</small></span>)}</div></div>;
}

function MiniPalRow({ pal }: { pal: Pal }) {
  return <a className="mini-pal-row" href="#/pals"><img src={pal.image} alt="" /><span><strong>{pal.name}</strong><small>Paldeck #{displayNumber(pal)}</small></span></a>;
}

function PalPicker({ label, value, onChange }: { label: string; value: number; onChange: (id: number) => void }) {
  const pal = findPal(value) || pals[0];
  return (
    <label className="pal-picker">
      <span>{label}</span>
      <div><img src={pal.image} alt="" /><select value={value} onChange={(event) => onChange(Number(event.target.value))}>{pals.slice(0, 220).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
    </label>
  );
}

function BreedingCombo({ index, left, right, child, rate }: { index: number; left: Pal; right: Pal; child: Pal; rate: string }) {
  return (
    <article className="combo-row">
      <strong className="rank">{index}</strong>
      <MiniPalBlock pal={left} />
      <span className="operator">+</span>
      <MiniPalBlock pal={right} />
      <span className="operator">→</span>
      <MiniPalBlock pal={child} large />
      <div><b>{rate}</b><small>Success Rate</small><small>{child.eggType || "Large Damp Egg"}</small></div>
      <button>☆</button>
    </article>
  );
}

function MiniPalBlock({ pal, large }: { pal: Pal; large?: boolean }) {
  return <div className={large ? "mini-pal-block large" : "mini-pal-block"}><img src={pal.image} alt="" /><strong>{pal.name}</strong><small>Lv. {Math.max(1, Math.min(55, Math.round((pal.id % 40) + 1)))}</small></div>;
}

function WorkRow({ pal, index }: { pal: Pal; index: number }) {
  return <div className="table-row"><strong>{index}</strong><span className="pal-cell"><img src={pal.image} alt="" />{pal.name}<small>#{displayNumber(pal)}</small></span><ElementChips elements={pal.elements} /><WorkDots work={pal.workSuitability} /><b className="green">{workScore(pal, "All Jobs")}</b><span className="green">Yes</span></div>;
}

function RanchRow({ pal, index }: { pal: Pal; index: number }) {
  const drop = ranchDrop(pal);
  return <div className="table-row ranch-row"><strong>{index}</strong><span className="pal-cell"><img src={pal.image} alt="" />{pal.name}<small>#{displayNumber(pal)}</small></span><ElementChips elements={pal.elements} /><span>{drop}</span><b>{Math.max(3, workScore(pal, "Farming") % 14)}</b><span className="green">100%</span><span className="green">✓</span></div>;
}

function RanchProduction({ pal }: { pal: Pal }) {
  const drop = ranchDrop(pal);
  return <div className="ranch-production"><h3>Ranch Production</h3><div className="production-card"><strong>{drop}</strong><InfoList rows={[["Production Amount", String(Math.max(3, workScore(pal, "Farming") % 14))], ["Drop Rate", "100%"], ["Cycle", "30m 00s"]]} /></div></div>;
}

function ItemCard({ item }: { item: Resource }) {
  return <article className="item-card"><button className="favorite">☆</button><img src={item.image} alt={item.name} /><strong>{item.name}</strong><small>{item.category}</small></article>;
}

function ItemDetail({ item }: { item: Resource }) {
  return (
    <div className="item-detail-inner">
      <button className="close-button">×</button>
      <img src={item.image} alt={item.name} />
      <h2>{item.name}</h2>
      <Badge>{item.category}</Badge>
      <p>{item.description || "An item used throughout Palworld."}</p>
      <InfoList rows={[["Category", item.category], ["Rarity", "Common"], ["Weight", "0.1"], ["Stack Size", "999"], ["Sell Price", "50"], ["Unlock Level", "Lv. 1"]]} />
      <h3>Obtained From</h3>
      {item.obtainedFrom.slice(0, 6).map((source) => <div className="source-row" key={`${source.type}-${source.name}`}>{source.name}<small>{source.notes}</small></div>)}
      <button>View Full Details</button>
    </div>
  );
}

function InsightCards({ top }: { top: Pal }) {
  return <div className="insights"><h3>Work Guide Insights</h3><div><MiniPalBlock pal={top} /><MiniPalBlock pal={top} /><MiniPalBlock pal={findPalByName("Digtoise") || top} /></div></div>;
}

function ToolCard({ title, detail, content, wide }: { title: string; detail: string; content: React.ReactNode; wide?: boolean }) {
  return <section className={wide ? "panel tool-card wide" : "panel tool-card"}><header className="section-title"><span>{title}</span></header><p>{detail}</p>{content}</section>;
}

function PartyMini() {
  return <div className="mini-stack">{pals.slice(180, 185).map((pal) => <MiniPalRow pal={pal} key={pal.id} />)}<Badge>Coverage score 8.4 / 10</Badge></div>;
}

function CaptureAdvisor({ tracking }: { tracking: TrackedState }) {
  return <div className="mini-stack">{pals.filter((pal) => pal.habitats.length).slice(0, 4).map((pal) => <MiniPalRow pal={pal} key={pal.id} />)}<span className="green">Recommended for Lv. {tracking.playerLevel}</span></div>;
}

function ResourceMini() {
  return <div className="mini-stack">{resources.slice(0, 5).map((item) => <span className="material-row" key={item.id}>{item.name}<b>{item.obtainedFrom.length} sources</b></span>)}</div>;
}

function MountMini() {
  return <div className="mini-stack">{pals.filter(hasMount).slice(0, 5).map((pal) => <MiniPalRow pal={pal} key={pal.id} />)}</div>;
}

function BossMini({ tracking, updateTracking }: { tracking: TrackedState; updateTracking: (next: Partial<TrackedState>) => void }) {
  const bosses = ["Zoe & Grizzbolt", "Lily & Lyleen", "Axel & Orserk", "Marcus & Faleris"];
  return <div className="mini-stack">{bosses.map((boss) => <label className="check-row" key={boss}><span>{boss}<small>Lv. {20 + boss.length}</small></span><input type="checkbox" checked={tracking.bossGoals.includes(boss)} onChange={() => updateTracking({ bossGoals: tracking.bossGoals.includes(boss) ? tracking.bossGoals.filter((item) => item !== boss) : [...tracking.bossGoals, boss] })} /></label>)}</div>;
}

function ElementChips({ elements }: { elements: string[] }) {
  return <div className="element-chips">{elements.length ? elements.map((element) => <span style={{ "--chip": elementColor[element] || "#7bd9ff" } as React.CSSProperties} key={element}>{elementGlyph[element] || "•"} {element}</span>) : <span>Unknown</span>}</div>;
}

function WorkDots({ work, labelled }: { work: WorkSuitability[]; labelled?: boolean }) {
  const visible = labelled ? work : work.slice(0, 4);
  return <div className={labelled ? "work-dots labelled" : "work-dots"}>{visible.map((item) => <span key={item.type} title={`${item.type} Lv. ${item.level}`}>{workGlyph[item.type] || "•"}<b>{item.level}</b>{labelled && <small>{shortWork(item.type)}</small>}</span>)}</div>;
}

function InfoList({ rows }: { rows: [string, string][] }) {
  return <dl className="info-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}

function Progress({ label, value, max }: { label: string; value: number; max: number }) {
  return <div className="progress-row"><span>{label}</span><strong>{value} / {max}</strong><div><i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div></div>;
}

function MobileNav({ page }: { page: Page }) {
  return <nav className="mobile-nav">{navItems.slice(0, 5).map((item) => <a className={item.page === page ? "active" : ""} href={`#/${item.page}`} key={item.page}><Icon name={item.icon} /><small>{item.label}</small></a>)}</nav>;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string[]> = {
    home: ["M3 11.5 12 4l9 7.5", "M5.5 10.5V20h13v-9.5", "M9.5 20v-5h5v5"],
    pin: ["M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z", "M12 10.2h.01"],
    pal: ["M7 10c-2 0-3-1-3-2.5S5.2 5 6.8 6.2", "M17 10c2 0 3-1 3-2.5S18.8 5 17.2 6.2", "M12 7c4.2 0 7 2.7 7 6.4C19 17 16.1 20 12 20s-7-3-7-6.6C5 9.7 7.8 7 12 7Z"],
    breed: ["M20.5 8.8c0 5.2-8.5 10.2-8.5 10.2S3.5 14 3.5 8.8A4.8 4.8 0 0 1 12 5.7a4.8 4.8 0 0 1 8.5 3.1Z"],
    work: ["M13 2 5 13h6l-1 9 8-12h-6l1-8Z"],
    ranch: ["M4 11h16", "M6 11v9", "M18 11v9", "M8 11V7l4-3 4 3v4"],
    bag: ["M6 8h12l1 12H5L6 8Z", "M9 8a3 3 0 0 1 6 0"],
    tech: ["M12 2v5", "M12 17v5", "M4.2 4.2l3.5 3.5", "M16.3 16.3l3.5 3.5", "M2 12h5", "M17 12h5", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"],
    tool: ["M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3 3-3Z"],
    search: ["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z", "M16 16l5 5"],
    menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
    moon: ["M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z"],
    bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z", "M10 21h4"],
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{(paths[name] || paths.tech).map((d) => <path d={d} key={d} />)}</svg>;
}

function parsePage(): Page {
  const page = window.location.hash.replace("#/", "") as Page;
  return navItems.some((item) => item.page === page) ? page : "dashboard";
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items)).sort();
}

function findPal(id: number) {
  return pals.find((pal) => pal.id === id);
}

function findPalByName(name: string) {
  return pals.find((pal) => pal.name.toLowerCase() === name.toLowerCase());
}

function displayNumber(pal: Pal) {
  return pal.paldeckNumber || String(pal.id).padStart(3, "0");
}

function cleanSkill(text: string) {
  return text.replace(/<[^>]+>/g, "").replace(/\{[^}]+\}/g, "").replace(/\|/g, " ").replace(/\s+/g, " ").trim();
}

function highestWork(pal: Pal) {
  return [...pal.workSuitability].sort((a, b) => b.level - a.level)[0];
}

function workScore(pal: Pal, type: string) {
  if (type !== "All Jobs") return (pal.workSuitability.find((work) => work.type === type)?.level || 0) * 210 + pal.workSuitability.length * 9;
  return pal.workSuitability.reduce((total, work) => total + work.level * 90, 0) + pal.workSuitability.length * 12;
}

function shortWork(type: string) {
  return type.replace("Generating Electricity", "Electricity").replace("Medicine Production", "Medicine");
}

function hasMount(pal: Pal) {
  return cleanSkill(pal.partnerSkill?.description || "").toLowerCase().includes("ridden") || cleanSkill(pal.partnerSkill?.description || "").toLowerCase().includes("mount");
}

function isRanchPal(pal: Pal) {
  return pal.workSuitability.some((work) => work.type === "Farming");
}

function ranchDrop(pal: Pal) {
  const drop = pal.possibleDrops[0];
  const item = drop ? resources.find((resource) => resource.id === drop.resourceId) : undefined;
  return item?.name || "Wool";
}

export default function App() {
  return (
    <CollectionProvider>
      <AppShell />
    </CollectionProvider>
  );
}
