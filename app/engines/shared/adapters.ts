/**
 * Creation Engine Adapters
 *
 * Adapters connect engines to external services (Etsy, POD, export, etc.)
 * without hardcoding service logic into the core engine.
 *
 * Pattern:
 * - Each adapter implements a standard interface.
 * - Adapters handle auth, API calls, data transformation.
 * - Engines remain usable without adapters (local export always works).
 * - Adding a new service = create an adapter, register it.
 */

import type { CreationProject, PublishedDestination, FileExport, ServiceConnection } from "./creation-engine.types";

// ============================================================================
// ADAPTER INTERFACE
// ============================================================================

export interface CreationAdapter {
  /** Service identifier (e.g., "etsy", "gumroad", "pod-printful") */
  id: string;

  /** Human-readable name */
  name: string;

  /** What this adapter does */
  description: string;

  /** Adapter type: auth, export, publish, storage, etc. */
  type: "auth" | "export" | "publish" | "asset-storage" | "other";

  /** Check if this adapter is available / configured */
  isAvailable(): boolean;

  /** Check if user is authenticated with this service */
  isAuthenticated(): Promise<boolean>;

  /** Initiate OAuth or connection flow (async) */
  connect(): Promise<ServiceConnection>;

  /** Disconnect / revoke credentials */
  disconnect(): Promise<void>;

  /**
   * Publish / export to this service.
   * Returns the published destination info and external ID.
   */
  publish(project: CreationProject, options?: Record<string, unknown>): Promise<PublishedDestination>;

  /**
   * Sync data with the service (fetch status, updates, etc.)
   */
  sync(project: CreationProject): Promise<Partial<CreationProject>>;

  /**
   * Receive updates from webhook / polling (optional)
   */
  handleWebhook?(payload: Record<string, unknown>): Promise<void>;
}

// ============================================================================
// EXPORT ADAPTER (LOCAL FILE GENERATION)
// ============================================================================

export class ExportAdapter implements CreationAdapter {
  id = "export";
  name = "Local Export";
  description = "Generate downloadable files (JSON, Markdown, PDF, ZIP packages).";
  type = "export" as const;

  isAvailable(): boolean {
    return typeof window !== "undefined"; // Client-side only.
  }

  async isAuthenticated(): Promise<boolean> {
    return true; // No auth needed.
  }

  async connect(): Promise<ServiceConnection> {
    return {
      serviceId: "export",
      connectedAt: new Date().toISOString(),
      authenticated: true,
    };
  }

  async disconnect(): Promise<void> {
    // Nothing to do.
  }

  async publish(project: CreationProject, options?: Record<string, unknown>): Promise<PublishedDestination> {
    const format = (options?.format as string) || "json";

    // Generate the export package based on format.
    const content = this.generateExport(project, format);
    const fileName = `${project.name.toLowerCase().replace(/\s+/g, "-")}.${this.getExtension(format)}`;

    // Trigger download.
    const blob = new Blob([content], { type: this.getMimeType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Record the export.
    return {
      service: "export",
      publishedAt: new Date().toISOString(),
      externalUrl: fileName,
      publicStatus: "draft",
    };
  }

  async sync(project: CreationProject): Promise<Partial<CreationProject>> {
    return {}; // No sync needed for local export.
  }

  private generateExport(project: CreationProject, format: string): string {
    if (format === "json") {
      return JSON.stringify(project, null, 2);
    }

    if (format === "markdown") {
      return `# ${project.name}

${project.description || ""}

## Details

**Engine:** ${project.engineId}
**Status:** ${project.status}
**Created:** ${project.createdAt}

### Answers

\`\`\`
${JSON.stringify(project.answers, null, 2)}
\`\`\`

### Build Content

\`\`\`
${JSON.stringify(project.buildContent, null, 2)}
\`\`\`
`;
    }

    // Default: JSON
    return JSON.stringify(project, null, 2);
  }

  private getExtension(format: string): string {
    const map: Record<string, string> = { json: "json", markdown: "md", md: "md", pdf: "pdf", zip: "zip" };
    return map[format] || "json";
  }

  private getMimeType(format: string): string {
    const map: Record<string, string> = {
      json: "application/json",
      markdown: "text/markdown",
      md: "text/markdown",
      pdf: "application/pdf",
      zip: "application/zip",
    };
    return map[format] || "application/json";
  }
}

// ============================================================================
// ETSY ADAPTER (PLACEHOLDER FOR NOW)
// ============================================================================

/**
 * Etsy API adapter. Handles OAuth, listing operations, shop sync.
 * Real implementation will live in app/engines/adapters/etsy-adapter.ts
 */
export class EtsyAdapter implements CreationAdapter {
  id = "etsy";
  name = "Etsy";
  description = "Publish products to your Etsy shop.";
  type = "publish" as const;

  private shopId?: string;
  private accessToken?: string;

  constructor(shopId?: string, accessToken?: string) {
    this.shopId = shopId;
    this.accessToken = accessToken;
  }

  isAvailable(): boolean {
    return typeof process !== "undefined" && !!process.env.ETSY_SHOP_ID;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.accessToken && !!this.shopId;
  }

  async connect(): Promise<ServiceConnection> {
    // TODO: Implement Etsy OAuth flow.
    // For now, placeholder.
    throw new Error("Etsy OAuth not yet implemented. Credentials will be set in environment.");
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined;
    this.shopId = undefined;
  }

  async publish(project: CreationProject, options?: Record<string, unknown>): Promise<PublishedDestination> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated with Etsy.");
    }

    // TODO: Call Etsy API to create listing.
    // For now, placeholder returning mock data.
    const listingId = `${Date.now()}`;

    return {
      service: "etsy",
      publishedAt: new Date().toISOString(),
      externalId: listingId,
      externalUrl: `https://www.etsy.com/listing/${listingId}`,
      publicStatus: "draft",
    };
  }

  async sync(project: CreationProject): Promise<Partial<CreationProject>> {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated with Etsy.");
    }

    // TODO: Fetch shop info, sync listings, etc.
    return {};
  }
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

export type AdapterInstance = CreationAdapter;

type AdapterFactory = () => CreationAdapter;
const ADAPTERS: Map<string, AdapterFactory> = new Map();
ADAPTERS.set("export", () => new ExportAdapter());
ADAPTERS.set("etsy", () => new EtsyAdapter());

export function getAdapter(id: string): CreationAdapter | undefined {
  const factory = ADAPTERS.get(id);
  return factory?.();
}

export function registerAdapter(id: string, factory: AdapterFactory): void {
  ADAPTERS.set(id, factory);
}

export function getAvailableAdapters(): CreationAdapter[] {
  return Array.from(ADAPTERS.values())
    .map((factory) => factory())
    .filter((adapter) => adapter.isAvailable());
}
