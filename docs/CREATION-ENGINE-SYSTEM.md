# StepInTheRing Creation Engine System

## Overview

The Creation Engine System is a **shared architecture** for all creative engines in StepInTheRing. Each engine helps creators move from *idea to real product* following a consistent workflow:

**Spark → Explore → Score → Build → Review → Package → Export → Publish**

### Core Principle

Every engine produces **real output** — not suggestions, not outlines, but actual files, designs, listings, or drafts that users can download, export, or publish.

---

## Architecture

### Shared Workflow

All engines inherit the same lifecycle:

| Stage | Description | Output |
|-------|-------------|--------|
| **Spark** | Answer intake questions about the idea | Answers saved; project created |
| **Explore** | Generate 3-5 distinct direction variations | Multiple directions to choose from |
| **Score** | Rate each direction on engine-specific dimensions | Transparent scores; reasoning visible |
| **Select** | Pick the strongest direction to develop | Direction locked; build content cleared |
| **Build** | Develop the selected concept into a package | Design package, manuscript, song structure, etc. |
| **Review** | Human approval gate before export/publish | Draft status; review notes; approval decision |
| **Package** | Prepare for external publishing (if applicable) | Etsy listing draft, export manifest, etc. |
| **Export** | Generate downloadable files | JSON, Markdown, PDF, ZIP, etc. |
| **Publish** | Send to external service (optional) | Etsy, Gumroad, website, etc. |

### Shared Project Statuses

```
spark
  ↓
exploring (evaluating directions)
  ↓
selected (direction chosen)
  ↓
creating (building the concept)
  ↓
ready-for-review
  ↓
approved (human sign-off)
  ↓
ready-to-export / ready-to-publish
  ↓
published / archived
```

Transitions are defined in `creation-engine.types.ts:STATUS_TRANSITIONS`. Not all transitions are allowed (prevents invalid state changes).

---

## Core Models

### CreationProject

Generic project container holding:
- `engineId`: Which engine created this ("design-shop", "music", "fashion", etc.)
- `name`, `description`, `tags`: Metadata
- `answers`: Intake answers (preserved for editing)
- `status`, `stage`, `depth`, `destination`: Current workflow state
- `directions[]`: Multiple concept options (Explore stage)
- `scores[]`: Scoring data (Score stage)
- `buildContent`: Engine-specific content (design package, lyrics, etc.)
- `assets[]`: Images, files, mockups
- `exports[]`: Generated downloads (JSON, Markdown, PDF, etc.)
- `versions[]`: Version history + rollback capability
- `connections{}`: External service auth (Etsy, POD, etc.)
- `publishedTo[]`: Publication history (Etsy listings, URLs, etc.)

See `shared/creation-engine.types.ts` for full schema.

### Adapter Pattern

External services connect via **adapters**, not hardcoded integrations:

```typescript
interface CreationAdapter {
  id: string; // "etsy", "export", "pod-printful", etc.
  isAvailable(): boolean;
  isAuthenticated(): Promise<boolean>;
  connect(): Promise<ServiceConnection>;
  disconnect(): Promise<void>;
  publish(project, options?): Promise<PublishedDestination>;
  sync(project): Promise<Partial<CreationProject>>;
}
```

Benefits:
- Engine code stays clean (no Etsy/POD/GitHub API calls mixed in)
- Services can be added/removed without touching engine logic
- Projects remain usable offline (local export always works)
- Same adapter can serve multiple engines

Current adapters:
- **ExportAdapter**: Local file generation (JSON, Markdown, PDF)
- **EtsyAdapter**: Etsy OAuth, listing creation, shop sync (in progress)

### Engine Registry

Central `ENGINE_REGISTRY` in `shared/creation-engine.registry.ts` defines each engine:

```typescript
{
  id: "design-shop",
  name: "Design Shop Engine",
  emoji: "🛍️",
  category: "product",
  launched: true,
  
  // Workflow
  suggestedStage: "Spark",
  supportedStages: ["Spark", "Shaping", "Building", "Polishing", "Launching"],
  
  // Intake questions (Spark stage)
  intake: [ /* ... */ ],
  
  // Explore stage
  generatesDirections: true,
  directionsCount: 5,
  
  // Score stage
  scoringDimensions: [ /* ... */ ],
  
  // Output
  outputTypes: ["json", "markdown", "design", "listing"],
  specialties: [ /* engine-specific output sections */ ],
  
  // Adapters
  adapters: ["export", "etsy"],
  requiredAdapters: [],
  
  // Tech
  technical: false,
  requiresApproval: true,
}
```

---

## How to Add a New Engine

### Step 1: Design the Workflow

- What questions should Spark stage ask?
- How many direction options in Explore?
- What scoring dimensions matter?
- What's the real output?
- Which adapters do you need?

Document these in the engine descriptor.

### Step 2: Create Engine Files

```
/app/engines/[engine-id]/
  ├── [engine-id].engine.ts      # Generators, templates, specs
  ├── [engine-id].intake.ts      # Question definitions
  ├── [engine-id].scoring.ts     # Scoring logic
  ├── [engine-id].output.ts      # Build content / package templating
  └── [engine-id].adapter.ts     # If custom adapter needed
```

### Step 3: Register the Engine

Add descriptor to `ENGINE_REGISTRY` in `shared/creation-engine.registry.ts`:

```typescript
{
  id: "music",
  name: "Music Engine",
  emoji: "🎵",
  // ... descriptor fields
}
```

### Step 4: Build the Generators

Implement at minimum:
- `generateDirections(answers)` → `CreationDirection[]`
- `generateScores(direction, answers)` → scoring template
- `generateBuildContent(direction, answers)` → engine-specific package
- Specialty output generators (song structure, design mockups, etc.)

### Step 5: Add UI Routes (Later)

- `/engines/[id]/spark` → Intake form
- `/engines/[id]/explore` → Direction picker
- `/engines/[id]/score` → Scoring interface
- `/engines/[id]/create` → Build editor
- `/engines/[id]/review` → Approval gate
- `/engines/[id]/export` → Download options
- `/engines/[id]/publish` → Service integration

### Step 6: Document the Engine

- Real output description
- Key assumptions / constraints
- How to use each stage
- Example workflows

---

## Persistence & Versioning

### Local-First Storage

All projects save to browser `localStorage` via `shared/persistence.ts`:

```typescript
// Save a project
updateProject(project);

// Load all projects
const projects = loadProjects();

// Get specific project
const project = getProject(projectId);

// Version snapshots
saveVersion(projectId, "After design review");
restoreVersion(projectId, versionId);
```

### Version History

Each project maintains a `versions[]` array. Users can:
- Save snapshots at key points
- Restore to earlier versions
- See creation history

---

## Export & Publishing

### Local Export (Always Works)

Users can export any project as JSON/Markdown/ZIP without connecting external services:

```typescript
const adapter = getAdapter("export");
await adapter.publish(project, { format: "json" });
```

### Service Publishing (Optional)

Connect optional adapters for Etsy, Gumroad, etc.:

```typescript
const etsyAdapter = getAdapter("etsy");
if (await etsyAdapter.isAuthenticated()) {
  const result = await etsyAdapter.publish(project, {
    listingTitle: "...",
    // ...
  });
}
```

Adapters handle auth, API calls, error recovery. Projects remain usable if adapter isn't available.

---

## Real Output Requirement

Every engine must answer:

1. **What real thing does this create?**
   - Product designs, songs, stories, games, apps, etc.
   - Not: suggestions, generic prompts, inspiration lists.

2. **What files or assets leave the engine?**
   - Downloadable, editable, usable.
   - JSON/Markdown (portable), Canva links (editable), Etsy listings (publishable).

3. **Can users edit the result?**
   - JSON export → user can fork in their tool
   - Markdown listing → user can copy/paste to Etsy
   - Design files → user can import to Canva / design tool

4. **How is the result tested?**
   - Scoring before build (transparency)
   - Preview before publish
   - Dry-run export before Etsy

5. **Where can it be exported or published?**
   - At minimum: local JSON/Markdown download
   - Optionally: Etsy, POD, GitHub, website, etc.

6. **What still requires human action?**
   - Final approval before publish
   - Production decisions (printer, shipping)
   - Marketing / promotion
   - Legal / IP review

7. **What safety / quality checks are required?**
   - IP risk detection (celebrity, brands, copyrighted characters)
   - Accessibility validation
   - Completeness checks
   - Approval gates

---

## Example: Design Shop Engine

**Real output:** Product concepts → design packages → Etsy listings

**Files generated:**
- `design-package.json` (dimensions, specs, materials, copy)
- `listing-draft.md` (Etsy title, description, tags, price)
- `social-launch-kit.md` (captions, hashtags, video concepts)
- Mockup images (product in use, lifestyle, detail shots)

**Workflow:**
1. Spark: Answer product idea questions
2. Explore: Generate 5 directions (core concept, humorous take, educational, seasonal, bundle)
3. Score: Rate on Fun, Usefulness, Giftability, Originality, Ease, etc.
4. Build: Create design package (title, dimensions, print specs, original copy)
5. Review: Human approval (Ready for Etsy? Approved?)
6. Package: Prepare Etsy listing (title, tags, price, social captions)
7. Export: Download JSON + Markdown OR publish to Etsy directly

**External services:** Etsy (optional), Export (always available)

---

## Shared Components (For Future Use)

These utilities are available across all engines:

- **Persistence**: `createProject()`, `updateProject()`, `saveVersion()`, `restoreVersion()`
- **Adapters**: `getAdapter(id)`, `registerAdapter(id, factory)`
- **Registry**: `getEngineDescriptor(id)`, `getEnginesByCategory(category)`
- **Scoring**: Dimension definitions, scoring UI template
- **Status Machine**: `STATUS_TRANSITIONS` enforces valid workflow

---

## Deployment & Environment

### Shared Env Variables

```env
# Etsy (when adapter is needed)
ETSY_SHOP_ID=
ETSY_API_KEY=
ETSY_SHARED_SECRET=
ETSY_REDIRECT_URI=
ETSY_ACCESS_TOKEN=         (server-side only)
ETSY_REFRESH_TOKEN=        (server-side only)

# Future adapters
POD_PRINTFUL_API_KEY=
GITHUB_PAT=
```

**Never expose tokens to client-side code.**

### Building for Production

```bash
npm run build
npm run start
```

No special configuration needed. All creation engines use the same build process.

---

## Future Engines (Planned)

1. **Music Engine** — Song structure, lyrics, chords, arrangement
2. **Fashion Engine** — Garment design, tech-pack, colorways
3. **Story Engine** — Plot, characters, full manuscript draft
4. **Game Engine** — Mechanics, rules, components, prototypes
5. **App Engine** (upgrade) — Enhanced Build Engine with working code output

Each follows the same architecture: Spark → Explore → Score → Build → Review → Package → Export → Publish.

---

## Questions?

Refer to:
- `app/engines/shared/creation-engine.types.ts` — Data models
- `app/engines/shared/creation-engine.registry.ts` — Engine registry
- `app/engines/shared/adapters.ts` — Adapter pattern
- `app/engines/design-shop/` — Reference implementation
- `app/engines/shared/persistence.ts` — Persistence layer
