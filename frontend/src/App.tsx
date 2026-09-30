import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DeskShell } from "./components/DeskShell";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { JurisdictionGate } from "./components/JurisdictionGate";
import { useAccount } from "./hooks/useAccount";
import { useJurisdiction } from "./hooks/useJurisdiction";
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
  const jurisdiction = useJurisdiction();
  const backgroundRef = useRef<HTMLDivElement>(null);

  const surface = surfaceFor(location.route);
  const header = <Header surface={surface} navigate={navigate} account={account} />;
  const gated = GATED_ROUTES.includes(location.route);

  /* The gate is checked here, once, rather than in each page. While it is open
     the background carries no route content and is inert, so nothing behind it
     can be read or tabbed into. */
  const gateOpen = gated && jurisdiction.status !== "passed";

  useEffect(() => {
    const node = backgroundRef.current;
    if (!node) return;
    if (gateOpen) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [gateOpen]);

  const goHome = useCallback(() => navigate("/"), [navigate]);

  let content: ReactNode;
  if (location.route === "/") {
    content = <Landing navigate={navigate} header={header} />;
  } else if (location.route === "/contractor/grant") {
    /* A desk route carries its own header inside the desk surface. */
    content = gateOpen ? (
      <DeskShell header={header}>
        <main className="surface-blank" />
      </DeskShell>
    ) : (
      <ContractorGrant header={header} grantId={location.id} account={account} navigate={navigate} />
    );
  } else {
    content = (
      <>
        {header}
        {gateOpen ? (
          <main className="surface-blank" />
        ) : location.route === "/employer/fund" ? (
          <EmployerFund navigate={navigate} />
        ) : location.route === "/employer/grants" ? (
          <EmployerGrants navigate={navigate} />
        ) : (
          <CertGallery />
        )}
        <Footer gated={gated} />
      </>
    );
  }

  return (
    <>
      <div ref={backgroundRef}>{content}</div>
      {gateOpen && (
        <JurisdictionGate
          status={jurisdiction.status}
          region={jurisdiction.region}
          onChoose={jurisdiction.choose}
          onReset={jurisdiction.reset}
          onHome={goHome}
        />
      )}
    </>
  );
}
