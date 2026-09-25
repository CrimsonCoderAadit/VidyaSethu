"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLiteMode } from "../LiteMode";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

/** The three.js bundle is only fetched when this renders, so on phones / slow
 * networks (lite mode) the ~600 KB WebGL chunk is never downloaded at all. */
export function HeroSceneClient() {
  const lite = useLiteMode();
  // The login hero panel is `hidden lg:flex`; don't pay for WebGL on tablets where it's invisible.
  const [wide, setWide] = useState(false);
  useEffect(() => setWide(window.matchMedia("(min-width: 1024px)").matches), []);
  return lite === false && wide ? <HeroScene /> : null;
}
