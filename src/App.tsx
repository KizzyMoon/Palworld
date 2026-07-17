import { useEffect, useMemo, useState } from "react";
import { breeding, locations, metadata, pals, resources } from "./data";
import { CollectionProvider, useCollection } from "./collection";
import type { HabitatTime, Pal, Resource } from "./types";

type Page =
  | { name: "home" }
  | { name: "pals" }
  | { name: "pal"; key: string }
  | { name: "breeding" }
  | { name: "resources" }
  | { name: "resource"; id: string }
  | { name: "owned" }
  | { name: "favourites" }
  | { name: "settings" };

type SortMode = "number" | "name" | "rarity" | "breeding" | "work" | "owned" | "favourite";

const navItems = [
  { hash: "#/", label: "Home", icon: "⌂" },
  { hash: "#/pals", label: "Pals", icon: "◈" },
  { hash: "#/breeding", label: "Breed", icon: "◇" },
  { hash: "#/resources", label: "Items", icon: "⬡" },
  { hash: "#/owned", label: "Owned", icon: "✓" },
  { hash: "#/favourites", label: "Saved", icon: "★" },
  { hash: "#/settings", label: "More", icon: "☰" },
];

function parseHash(): Page {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "pals" && parts[1]) return { name: "pal", key: parts[1] };
  if (parts[0] === "pals") return { name: "pals" };
  if (parts[0] === "breeding") return { name: "breeding" };
  if (parts[0] === "resources" && parts[1]) return { name: "resource", id: parts[1] };
  if (parts[0] === "resources") return { name: "resources" };
  if (parts[0] === "owned") return { name: "owned" };
  if (parts[0] === "favourites") return { name: "favourites" };
  if (parts[0] === "settings") return { name: "settings" };
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
  const [theme, setTheme] = useState(localStorage.getItem("palworld-companion.theme") || "dark");

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
          {navItems.map((item) => (
            <a key={item.hash} className={routeFor(page) === item.hash ? "active" : ""} href={item.hash}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main>
        <PageContent page={page} theme={theme} setTheme={setTheme} />
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 6).map((item) => (
          <a key={item.hash} className={routeFor(page) === item.hash ? "active" : ""} href={item.hash}>
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </a>
        ))}
      </nav>
    </div>
  );
}

function PageContent({ page, theme, setTheme }: { page: Page; theme: string; setTheme: (theme: string) => void }) {
  if (page.name === "pals") return <PalsPage />;
  if (page.name === "pal") return <PalDetailsPage palKey={page.key} />;
  if (page.name === "breeding") return <BreedingPage />;
  if (page.name === "resources") return <ResourcesPage />;
  if (page.name === "resource") return <ResourceDetailsPage resourceId={page.id} />;
  if (page.name === "owned") return <PalCollectionPage mode="owned" />;
  if (page.name === "favourites") return <PalCollectionPage mode="favourites" />;
  if (page.name === "settings") return <SettingsPage theme={theme} setTheme={setTheme} />;
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
      <Hero title="Palworld Companion" eyebrow="Sample dataset">
        <GlobalSearch />
      </Hero>
      <section className="stats-grid">
        <Stat label="Total Pals" value={pals.length.toString()} />
        <Stat label="Owned" value={`${owned} / ${pals.length}`} />
        <Stat label="Favourites" value={favourites.toString()} />
        <Stat label="Completion" value={`${completion}%`} />
      </section>
      <section className="quick-actions">
        <a className="primary-action" href={`#/pals/${randomPal().key}`}>Random Pal</a>
        <a className="primary-action" href="#/pals">Browse all Pals</a>
        <a className="primary-action" href="#/breeding">Breeding calculator</a>
        <a className="primary-action" href="#/resources">Browse resources</a>
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
      <a className="pal-link" href={`#/pals/${pal.key}`}>
        <Avatar text={pal.image} label={pal.name} />
        <div>
          <span className="number">#{pal.id.toString().padStart(3, "0")}</span>
          <h3>{pal.name}</h3>
          <p>{pal.elements.join(" / ")} · {strongest ? `${strongest.type} ${strongest.level}` : "No work data"}</p>
          <HabitatBadges pal={pal} />
        </div>
      </a>
      <div className="card-actions">
        <button type="button" className={isOwned(pal.id) ? "toggle active" : "toggle"} onClick={() => toggleOwned(pal.id)} aria-pressed={isOwned(pal.id)} title={`Toggle owned for ${pal.name}`}>
          ✓ <span>{isOwned(pal.id) ? "Owned" : "Own"}</span>
        </button>
        <button type="button" className={isFavourite(pal.id) ? "toggle active favourite" : "toggle"} onClick={() => toggleFavourite(pal.id)} aria-pressed={isFavourite(pal.id)} title={`Toggle favourite for ${pal.name}`}>
          ★ <span>{isFavourite(pal.id) ? "Saved" : "Save"}</span>
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
          <span className="number">#{pal.id.toString().padStart(3, "0")}</span>
          <h1>{pal.name}</h1>
          <p>{pal.variant || pal.elements.join(" / ")}</p>
          <div className="card-actions">
            <button className={isOwned(pal.id) ? "toggle active" : "toggle"} onClick={() => toggleOwned(pal.id)} aria-pressed={isOwned(pal.id)}>✓ {isOwned(pal.id) ? "Owned" : "Mark owned"}</button>
            <button className={isFavourite(pal.id) ? "toggle active favourite" : "toggle"} onClick={() => toggleFavourite(pal.id)} aria-pressed={isFavourite(pal.id)}>★ {isFavourite(pal.id) ? "Favourite" : "Add favourite"}</button>
          </div>
          <div className="prev-next">
            {previous && <a href={`#/pals/${previous.key}`}>Previous: {previous.name}</a>}
            {next && <a href={`#/pals/${next.key}`}>Next: {next.name}</a>}
          </div>
        </div>
      </section>
      <section className="detail-grid">
        <Panel title="Overview">
          <p>{pal.description || "Information not currently available."}</p>
          <InfoRows rows={[
            ["Rarity", textOrUnknown(pal.rarity)],
            ["Egg type", pal.eggType || "Information not currently available."],
            ["Wild", pal.obtainableInWild ? "Yes" : "No or unknown"],
            ["Breeding", pal.obtainableByBreeding ? "Yes" : "No or unknown"],
            ["Alpha", pal.alpha ? "Yes" : "No"],
            ["Legendary", pal.legendary ? "Yes" : "No"],
          ]} />
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
        <Panel title="Habitat">
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
  const groups: HabitatTime[] = ["day", "night", "both"];
  const hasHabitats = pal.habitats.length > 0;
  return (
    <>
      {groups.map((time) => {
        const entries = pal.habitats.filter((habitat) => habitat.time === time);
        return (
          <div key={time} className="habitat-group">
            <h4>{timeLabel(time)}</h4>
            {entries.length ? entries.map((entry) => <p key={`${entry.locationId}-${entry.time}`}>{findLocation(entry.locationId)?.name || entry.locationId}: {entry.notes || "Information not currently available."}</p>) : <p>None listed.</p>}
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
      <Hero title="Breeding" eyebrow="Sample calculator">
        <p>Combinations are sample data unless verified in `DATA_SOURCES.md`.</p>
      </Hero>
      <section className="split">
        <Panel title="Two Parents to Child">
          <PalSelect label="Parent A" value={parentA} onChange={setParentA} />
          <PalSelect label="Parent B" value={parentB} onChange={setParentB} />
          {result ? <BreedingResult comboId={result.id} childId={result.childId} /> : <EmptyState text="No direct sample combination found." />}
        </Panel>
        <Panel title="Desired Child">
          <PalSelect label="Desired Pal" value={desired} onChange={setDesired} />
          {desiredCombos.length ? desiredCombos.map((combo) => <BreedingPair key={combo.id} combo={combo} />) : <EmptyState text="No known sample combinations for this Pal." />}
        </Panel>
      </section>
    </>
  );
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
        <p>{child.elements.join(" / ")} · {child.eggType || "Egg unknown"}</p>
        <p>{isOwned(child.id) ? "Owned" : "Not owned"} · {isFavourite(child.id) ? "Favourite" : "Not favourite"}</p>
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
              {entry.palId && findPal(entry.palId) ? <> · <a href={`#/pals/${findPal(entry.palId)?.key}`}>{findPal(entry.palId)?.name}</a></> : null}
              {entry.locationId && findLocation(entry.locationId) ? <> · {findLocation(entry.locationId)?.name}</> : null}
              {entry.notes ? ` · ${entry.notes}` : ""}
            </p>
          ))}
        </Panel>
        <Panel title="Uses">
          {resource.usedFor.length ? resource.usedFor.map((use) => <p key={`${use.type}-${use.name}`}>{use.name}{use.quantity ? ` x${use.quantity}` : ""} · {use.type}</p>) : <p>Information not currently available.</p>}
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

function SettingsPage({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void }) {
  const { exportCollection, importCollection, clearOwned, clearFavourites, clearAll } = useCollection();
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");

  return (
    <>
      <Hero title="Settings" eyebrow="Progress and display" />
      <section className="detail-grid">
        <Panel title="Display">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Switch to {theme === "dark" ? "light" : "dark"} mode</button>
          <p>Reduced motion follows your device setting.</p>
        </Panel>
        <Panel title="Export Progress">
          <textarea readOnly value={exportCollection()} aria-label="Exported progress data" />
        </Panel>
        <Panel title="Import Progress">
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste exported progress JSON" aria-label="Progress import JSON" />
          <button onClick={() => setMessage(importCollection(importText) ? "Progress imported." : "Import failed. Check the JSON and try again.")}>Import</button>
          {message && <p>{message}</p>}
        </Panel>
        <Panel title="Clear Progress">
          <button onClick={() => window.confirm("Clear all owned Pals?") && clearOwned()}>Clear Owned Pals</button>
          <button onClick={() => window.confirm("Clear all favourites?") && clearFavourites()}>Clear Favourites</button>
          <button onClick={() => window.confirm("Clear all Palworld Companion progress?") && clearAll()}>Clear All Progress</button>
        </Panel>
        <Panel title="About">
          <InfoRows rows={[
            ["App version", metadata.appVersion],
            ["Dataset version", metadata.datasetVersion],
            ["Last update", metadata.lastUpdated],
            ["Game data", metadata.gameVersion],
          ]} />
        </Panel>
      </section>
    </>
  );
}

function PalSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {pals.map((pal) => <option key={pal.id} value={pal.id}>{pal.id.toString().padStart(3, "0")} · {pal.name}</option>)}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
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

function EmptyState({ text }: { text: string }) {
  return <section className="empty-state">{text}</section>;
}

function Avatar({ text, label, large }: { text: string; label: string; large?: boolean }) {
  return <span className={large ? "avatar large" : "avatar"} aria-label={label}>{text}</span>;
}

function HabitatBadges({ pal }: { pal: Pal }) {
  const times = unique(pal.habitats.map((habitat) => habitat.time));
  if (!times.length && !pal.alphaLocations?.length) return <span className="badge">Habitat unknown</span>;
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

function textOrUnknown(value: unknown) {
  return value === null || value === undefined ? "Information not currently available." : String(value);
}

function timeLabel(time: HabitatTime) {
  if (time === "day") return "☀ Day";
  if (time === "night") return "☾ Night";
  return "☀/☾ Both";
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

export default function App() {
  return (
    <CollectionProvider>
      <AppShell />
    </CollectionProvider>
  );
}
