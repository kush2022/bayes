"use client";

import React, { useRef } from "react";

// Define proper types for Plotly data structures
interface PlotlyData {
  x?: unknown[];
  y?: unknown[];
  z?: unknown[];
  type?: string;
  mode?: string;
  name?: string;
  [key: string]: unknown;
}

interface PlotlyLayout {
  title?: string | { text: string };
  xaxis?: { title?: string };
  yaxis?: { title?: string };
  width?: number;
  height?: number;
  [key: string]: unknown;
}

interface PlotlyConfig {
  displayModeBar?: boolean;
  responsive?: boolean;
  [key: string]: unknown;
}

interface ParsedPlotlyData {
  divId: string | null;
  data: PlotlyData[] | null;
  layout: PlotlyLayout | null;
  config: PlotlyConfig | null;
}

// Utility to extract the div id and Plotly.newPlot arguments from the HTML snippet
function parsePlotlyHtml(html: string): ParsedPlotlyData {
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
  let data: PlotlyData[] | null = null;
  let layout: PlotlyLayout | null = null;
  let config: PlotlyConfig | null = null;
  
  try {
    // Split arguments by top-level commas
    const args: string[] = [];
    let arg = "";
    let depth = 0;
    for (const c of plotlyCallMatch[2]) {
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

    data = eval("(" + args[0] + ")") as PlotlyData[];
    layout = args[1] ? (eval("(" + args[1] + ")") as PlotlyLayout) : {};
    config = args[2] ? (eval("(" + args[2] + ")") as PlotlyConfig) : {};
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
