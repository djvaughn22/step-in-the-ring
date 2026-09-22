// The single fictional demo business the whole UAT walks through. Ported
// from iDontCry's "ClearPath Property Services" template — a made-up
// property-services company, not Step In The Ring itself. This is the demo
// customer a small-business owner would see the Digital Front Desk running
// for, the same way iDontCry's copy demonstrated the concept there.
//
// The iDontCry version also shipped a second, inactive "Build Machine"
// business template purely to prove the model was configurable. Dropped
// here on purpose: the Onboarding preview already demonstrates that a
// different business can be configured, without carrying a second unused
// data shape through every function in this file.

import type { ServiceDefinition } from "./types";

export const DEMO_BUSINESS = {
  name: "ClearPath Property Services",
  tagline: "A fictional property-services business used to demo the Digital Front Desk.",
  services: [
    { id: "repairs", name: "Minor Repairs", description: "Drywall, hardware, locks, fixtures." },
    { id: "checks", name: "Property Checks", description: "Inspection and assessment." },
    { id: "assembly", name: "Furniture Assembly", description: "Flat-pack and similar items." },
    { id: "junk", name: "Junk Removal", description: "Hauling and disposal." },
    { id: "pressure", name: "Pressure Washing", description: "Exterior surfaces." },
    { id: "cleanup", name: "Exterior Cleanup", description: "Landscaping and trim work." },
  ] as ServiceDefinition[],
  serviceAreas: ["Downtown", "Midtown", "Suburbs", "Airport District"],
  supportEmail: "demo@clearpath.example",
};

export function serviceName(serviceId: string): string {
  return DEMO_BUSINESS.services.find((s) => s.id === serviceId)?.name ?? serviceId;
}
