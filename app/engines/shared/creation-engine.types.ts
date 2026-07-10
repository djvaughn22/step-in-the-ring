/**
 * StepInTheRing Creation Engine System
 *
 * Shared data models and types for all creative engines.
 * Pattern: Spark → Explore → Score → Build → Review → Package → Export → Publish
 */

import type { BuildStage, Depth, Destination } from "../engines";

// ============================================================================
// STATUS & LIFECYCLE
// ============================================================================

export type CreationStatus =
  | "spark"
  | "exploring"
  | "selected"
  | "creating"
  | "ready-for-review"
  | "approved"
  | "ready-to-export"
  | "ready-to-publish"
  | "published"
  | "archived";

export const CREATION_STATUS_LABELS: Record<CreationStatus, string> = {
  spark: "Spark",
  exploring: "Exploring Directions",
  selected: "Direction Selected",
  creating: "Creating",
  "ready-for-review": "Ready for Review",
  approved: "Approved",
  "ready-to-export": "Ready to Export",
  "ready-to-publish": "Ready to Publish",
  published: "Published",
  archived: "Archived",
};

// Allowed status transitions (state machine).
export const STATUS_TRANSITIONS: Record<CreationStatus, CreationStatus[]> = {
  spark: ["exploring", "archived"],
  exploring: ["selected", "spark", "archived"],
  selected: ["creating", "exploring", "archived"],
  creating: ["ready-for-review", "selected", "archived"],
  "ready-for-review": ["approved", "creating", "archived"],
  approved: ["ready-to-export", "ready-for-review", "archived"],
  "ready-to-export": ["ready-to-publish", "approved", "archived"],
  "ready-to-publish": ["published", "ready-to-export", "archived"],
  published: ["ready-to-export", "archived"],
  archived: ["spark"],
};

// ============================================================================
// ASSET & FILE STORAGE
// ============================================================================

export interface Asset {
  id: string;
  type: "image" | "file" | "mockup" | "design" | "export";
  name: string;
  url?: string; // Local data URL or external URL.
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FileExport {
  id: string;
  type: "json" | "markdown" | "pdf" | "zip" | "png" | "svg" | "other";
  name: string;
  url: string; // Blob URL or download link.
  generatedAt: string;
  exportedVia: string; // Engine ID or adapter name.
}

// ============================================================================
// GENERIC PROJECT MODEL
// ============================================================================

export interface CreationProject {
  id: string;
  engineId: string; // "design-shop", "music", "fashion", etc.
  name: string;
  description?: string;

  // Intake answers (preserved for future reference + editing).
  answers: Record<string, string>;

  // Current workflow state.
  status: CreationStatus;
  stage: BuildStage; // "Spark", "Building", "Launching", etc.
  depth: Depth;
  destination: Destination;

  // Multi-direction exploration (Explore stage).
  directions?: CreationDirection[];
  selectedDirectionId?: string;

  // Scoring / evaluation.
  scores?: CreationScore[];

  // Building / creation.
  buildContent?: Record<string, unknown>; // Engine-specific content (design package, etc.).

  // Assets (images, files, mockups).
  assets: Asset[];

  // Exports (generated files, listings, etc.).
  exports: FileExport[];

  // External service connections.
  connections?: Record<string, ServiceConnection>;

  // Version history + rollback.
  versions: CreationVersion[];
  currentVersionId: string;

  // Approval workflow.
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  // Publishing.
  publishedTo?: PublishedDestination[];
  externalIds?: Record<string, string>; // e.g., { "etsy": "123456" }

  // Metadata.
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  archived?: boolean;
}

// ============================================================================
// DIRECTIONS (EXPLORE STAGE)
// ============================================================================

export interface CreationDirection {
  id: string;
  label: string;
  description: string;
  reasoning?: string;
  previewImage?: string;
  selected?: boolean;
  createdAt: string;
}

// ============================================================================
// SCORING SYSTEM
// ============================================================================

export interface ScoringDimension {
  id: string;
  name: string;
  description: string;
  scale: "1-5" | "1-10" | "boolean";
  weight?: number; // Importance multiplier (default 1).
}

export interface CreationScore {
  id: string;
  directionId?: string; // Optional: score a specific direction.
  scores: Record<string, number | boolean>; // dimension.id → score.
  notes?: string;
  scoredAt: string;
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

export interface CreationVersion {
  id: string;
  label: string;
  description?: string;
  status: CreationStatus;
  buildContent?: Record<string, unknown>;
  createdAt: string;
  savedBy?: string;
}

// ============================================================================
// SERVICE CONNECTIONS
// ============================================================================

export interface ServiceConnection {
  serviceId: string; // "etsy", "pod-provider", etc.
  connectedAt: string;
  authenticated: boolean;
  lastSyncedAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PUBLISHED DESTINATIONS
// ============================================================================

export interface PublishedDestination {
  service: string; // "etsy", "gumroad", "website", etc.
  publishedAt: string;
  externalUrl?: string;
  externalId?: string;
  publicStatus: "draft" | "active" | "delisted" | "archived";
}
