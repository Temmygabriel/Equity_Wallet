/* "/__cert" is a temporary verification route (spec checkpoint 2) and is
   removed before the final commit. */
export const routes = ["/", "/employer/fund", "/employer/grants", "/contractor/grant", "/__cert"] as const;

export type Route = (typeof routes)[number];

/** Routes behind the demo-only jurisdiction gate (spec §6A.1). */
export const GATED_ROUTES: readonly Route[] = ["/employer/fund", "/employer/grants", "/contractor/grant"];

export type Surface = "desk" | "paper";

/** The desk is the landing hero and the contractor page; everything else is paper. */
export const surfaceFor = (route: Route): Surface =>
  route === "/" || route === "/contractor/grant" ? "desk" : "paper";
