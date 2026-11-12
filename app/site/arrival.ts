// ─────────────────────────────────────────────────────────────────────────────
// ARRIVAL — taking a few query parameters out of the address bar before anything
// else on the page can read it.
//
// Two reasons it has to happen this early, in a script at the top of <head>:
//
//   1. PRIVACY. ?idea= and ?cr= carry words somebody typed on another site.
//      Analytics reads the address bar, and we say we don't count what people
//      type. Scrubbing it from an effect is a race; this isn't.
//   2. THE ROUTER. Next (16.2.9, create-initial-router-state.js) seeds its route
//      cache with the URL of the first load. A later <Link> to that same page
//      gets that URL's query string back, so after a hard load of /?open=workspace
//      the wordmark was a dead click, and after /create?idea=... the Create link
//      would have put somebody's words back in the address bar. If the router
//      never sees the query, none of that happens. For the same reason a link to
//      these pages with one of these parameters must be a plain <a>, not <Link>:
//      even a prefetch of one makes the router remember it (locked by a test).
//
// Only the two pages that mount RingApp, and only these parameters. Anything else
// in the URL (a campaign tag, say) is left where it is. If sessionStorage is
// blocked nothing moves, and RingApp reads the URL itself as before.
// ─────────────────────────────────────────────────────────────────────────────

const ARRIVAL_KEY = "sitr-arrival";

/** The URL without the parameters this file moves. Anything else stays. */
export function withoutArrivalParams(): string {
  const url = new URL(window.location.href);
  for (const key of ["open", "idea", "stem", "cr", "handoff"]) url.searchParams.delete(key);
  return url.pathname + url.search + url.hash;
}

/** Runs first in <head>. Plain ES5, no imports: it ships as a string. */
export const HEAD_ARRIVAL_JS = `(function(){try{
var l=location,p=l.pathname;
if(p!=="/"&&p!=="/create"&&p!=="/make")return;
var q=new URLSearchParams(l.search),k=["open","idea","stem","cr","handoff"],f=false,i;
for(i=0;i<k.length;i++)if(q.has(k[i])){f=true;q.delete(k[i]);}
if(!f)return;
sessionStorage.setItem(${JSON.stringify(ARRIVAL_KEY)},l.search);
var s=q.toString();
history.replaceState(history.state,"",p+(s?"?"+s:"")+l.hash);
}catch(e){}})();`.replace(/\n/g, "");

/**
 * True when this tab arrived carrying a handoff that hasn't been read yet.
 * The home page uses it to send the visitor on to /make, where RingApp reads
 * it, since the AI front door moved off "/" on 2026-11-11.
 */
export function hasArrival(): boolean {
  try {
    return window.sessionStorage.getItem(ARRIVAL_KEY) !== null;
  } catch {
    return false;
  }
}

/** The query string this page really arrived with, once. Null if it was clean. */
export function takeArrival(): string | null {
  try {
    const search = window.sessionStorage.getItem(ARRIVAL_KEY);
    window.sessionStorage.removeItem(ARRIVAL_KEY);
    return search;
  } catch {
    return null;
  }
}
