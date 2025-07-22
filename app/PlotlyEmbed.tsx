"use client";

import React, { useEffect, useRef } from "react";

// Utility to extract the div id and Plotly.newPlot arguments from the HTML snippet
function parsePlotlyHtml(html: string): { divId: string | null; data: any; layout: any; config: any } {
  // Extract the div id
  const divMatch = html.match(/<div[^>]+id="([^"]+)"[^>]*class="plotly-graph-div"[^>]*>/);
  const divId = divMatch ? divMatch[1] : null;

  // Extract the Plotly.newPlot call and its arguments
  // Match: Plotly.newPlot("divId", data, layout, config)
  const plotlyCallMatch = html.match(/Plotly\.newPlot\(\s*"([^"]+)"\s*,([\s\S]+?)\)\s*;/);
  if (!plotlyCallMatch) {
    return { divId, data: null, layout: null, config: null };
  }
  // plotlyCallMatch[2] contains: data, layout, config
  // We'll try to parse the arguments as JSON
  let data: any = null, layout: any = null, config: any = null;
  try {
    // Split arguments by top-level commas
    const args = [];
    let arg = "";
    let depth = 0;
    for (let c of plotlyCallMatch[2]) {
      if (c === "[" || c === "{") depth++;
      if (c === "]" || c === "}") depth--;
      if (c === "," && depth === 0) {
        args.push(arg);
        arg = "";
      } else {
        arg += c;
      }
    }
    if (arg.trim()) args.push(arg);

    data = eval("(" + args[0] + ")");
    layout = args[1] ? eval("(" + args[1] + ")") : {};
    config = args[2] ? eval("(" + args[2] + ")") : {};
  } catch (e) {
    // Fallback: don't render
    data = null;
    layout = null;
    config = null;
  }

  return { divId, data, layout, config };
}

type Props = {
  html: string;
};

export default function PlotlyEmbed({ html }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Render the HTML snippet in an iframe for full script support
  if (!html) return null;

  return (
    <iframe
      style={{ width: "100%", height: 400, border: "none", background: "white" }}
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin"
      title="Plotly Visualization"
    />
  );
}