import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Remembers each history entry's scroll position. New navigations start at the
// top; going Back (POP) returns to where the user was, waiting for the page
// content (e.g. a long poster grid) to be tall enough before scrolling.
const positions = new Map();

export default function ScrollToTop() {
  const { pathname, search, key } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Cleanup runs before the next page scrolls, so it captures the position the
  // user left this entry at.
  useLayoutEffect(() => () => positions.set(key, window.scrollY), [key]);

  useLayoutEffect(() => {
    const target = navType === "POP" ? positions.get(key) : undefined;
    if (!target) {
      window.scrollTo(0, 0);
      return;
    }
    let tries = 0;
    let timer;
    const attempt = () => {
      window.scrollTo(0, target);
      tries += 1;
      if (Math.abs(window.scrollY - target) > 2 && tries < 40) timer = setTimeout(attempt, 100);
    };
    attempt();
    return () => clearTimeout(timer);
  }, [pathname, search, key, navType]);

  return null;
}
