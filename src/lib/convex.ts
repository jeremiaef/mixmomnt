import { ConvexReactClient } from "convex/react";

// During build / static generation, NEXT_PUBLIC_CONVEX_URL may not be set.
// Return a placeholder — the real client is created once the env var is available.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl
  ? new ConvexReactClient(convexUrl)
  : (undefined as unknown as ConvexReactClient);

export default convex;
