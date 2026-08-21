import type { MetadataRoute } from "next";

// Every owner-only surface is private — kept out of crawls here and with
// X-Robots-Tag / meta noindex on the routes themselves. robots.txt is a
// courtesy to crawlers, not authentication; the real gate is server-side.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/author", "/owner", "/engines/room", "/projects", "/api/"],
    }],
  };
}
