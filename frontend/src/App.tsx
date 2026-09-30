import { useCallback, useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { useAccount } from "./hooks/useAccount";
import { CertGallery } from "./pages/CertGallery";
import { ContractorGrant } from "./pages/ContractorGrant";
import { EmployerFund } from "./pages/EmployerFund";
import { EmployerGrants } from "./pages/EmployerGrants";
import { Landing } from "./pages/Landing";
import { GATED_ROUTES, routes, surfaceFor, type Route } from "./routes";

type Location = { route: Route; id?: string };

function parse(pathname: string, search: string): Location {
  const route = (routes as readonly string[]).includes(pathname) ? (pathname as Route) : "/";
  const id = new URLSearchParams(search).get("id") ?? undefined;
  return { route, id };
}

/* No router library: four routes, one pushState, and back/forward support. */
function useLocation(): [Location, (to: string) => void] {
  const [location, setLocation] = useState<Location>(() =>
    parse(window.location.pathname, window.location.search)
  );

  useEffect(() => {
    const onPopState = () => setLocation(parse(window.location.pathname, window.location.search));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setLocation(parse(window.location.pathname, window.location.search));
  }, []);

  return [location, navigate];
}

export function App() {
  const [location, navigate] = useLocation();
  const account = useAccount();
  const surface = surfaceFor(location.route);
  const header = <Header surface={surface} navigate={navigate} account={account} />;

  /* Desk routes place the header inside their own full-viewport surface. */
  if (location.route === "/") return <Landing navigate={navigate} header={header} />;
  if (location.route === "/contractor/grant")
    return <ContractorGrant header={header} grantId={location.id} account={account} />;

  return (
    <>
      {header}
      {location.route === "/employer/fund" && <EmployerFund navigate={navigate} />}
      {location.route === "/employer/grants" && <EmployerGrants navigate={navigate} />}
      {location.route === "/__cert" && <CertGallery />}
      <Footer gated={GATED_ROUTES.includes(location.route)} />
    </>
  );
}
