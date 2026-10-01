export const routes = ["/", "/employer/fund", "/employer/grants", "/contractor/grant"] as const;

export type Route = (typeof routes)[number];

/** Routes behind the demo-only jurisdiction gate (spec §6A.1). */
/* `/contractor/grant` is deliberately not here. A certificate is read-only, and a judge
   should be able to open one without answering anything first (§25). The gate is raised
   on the contractor page by the release/claim click instead — see ContractorGrant. */
export const GATED_ROUTES: readonly Route[] = ["/employer/fund", "/employer/grants"];

export type Surface = "desk" | "paper";

/** The desk is the landing hero and the contractor page; everything else is paper. */
export const surfaceFor = (route: Route): Surface =>
  route === "/" || route === "/contractor/grant" ? "desk" : "paper";
