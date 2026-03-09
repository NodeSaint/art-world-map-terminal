#!/usr/bin/env node
'use strict';

const { loadGeoData } = require('../lib/geodata');
const { render } = require('../lib/renderer');
const { setupInput, cleanup } = require('../lib/input');
const { themes } = require('../lib/themes');

// Parse command line arguments
function parseArgs(argv) {
  const args = {
    theme: 'midnight',
    zoom: 1,
    centreLat: 0,
    centreLon: 0,
    projection: 'mercator',
    live: false,
    grid: false,
    labels: false,
    borders: true,
    ascii: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--live':
        args.live = true;
        break;
      case '--grid':
        args.grid = true;
        break;
      case '--label':
      case '--labels':
        args.labels = true;
        break;
      case '--borders':
        args.borders = true;
        break;
      case '--no-borders':
        args.borders = false;
        break;
      case '--ascii':
        args.ascii = true;
        break;
      case '--theme':
        args.theme = argv[++i] || 'midnight';
        break;
      case '--zoom':
        args.zoom = Math.max(1, Math.min(10, parseFloat(argv[++i]) || 1));
        break;
      case '--centre':
      case '--center': {
        const val = argv[++i] || '0,0';
        const parts = val.split(',');
        args.centreLat = parseFloat(parts[0]) || 0;
        args.centreLon = parseFloat(parts[1]) || 0;
        break;
      }
      case '--projection':
        args.projection = argv[++i] || 'mercator';
        break;
    }
  }

  // Detect truecolor support
  if (!args.ascii) {
    const colorterm = process.env.COLORTERM;
    if (colorterm !== 'truecolor' && colorterm !== '24bit') {
      // Check TERM as well
      const term = process.env.TERM || '';
      if (!term.includes('256color') && !term.includes('truecolor')) {
        // Conservative: don't auto-downgrade, most modern terminals support it
      }
    }
  }

  return args;
}

function showHelp() {
  const help = `
terra - A beautiful world map in your terminal

USAGE:
  terra [options]

OPTIONS:
  --live                Stay running, re-render on resize, keyboard controls
  --theme <name>        Colour theme: midnight, hacker, satellite, vapor, paper, heat
  --zoom <1-10>         Zoom level (default: 1)
  --centre <lat,lon>    Centre the map (also --center)
  --projection <name>   mercator (default) or equirectangular
  --grid                Show latitude/longitude grid lines
  --label               Show country labels
  --borders             Show country borders (default: on)
  --no-borders          Hide country borders
  --ascii               ASCII fallback mode (no Unicode/truecolor)
  -h, --help            Show this help

LIVE MODE KEYS:
  arrows    Pan the map
  + / -     Zoom in/out
  t         Cycle themes
  g         Toggle grid
  l         Toggle labels
  b         Toggle borders
  r         Reset view
  q         Quit
`;
  console.log(help);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Validate theme
  if (!themes[args.theme]) {
    console.error(`Unknown theme: ${args.theme}. Available: ${Object.keys(themes).join(', ')}`);
    process.exit(1);
  }

  // Load geo data
  let countries;
  try {
    countries = loadGeoData();
  } catch (err) {
    console.error('Failed to load world data:', err.message);
    process.exit(1);
  }

  if (args.live) {
    runLive(args, countries);
  } else {
    // Single render and exit
    const output = render({
      countries,
      themeName: args.theme,
      zoom: args.zoom,
      centreLon: args.centreLon,
      centreLat: args.centreLat,
      projection: args.projection,
      showGrid: args.grid,
      showLabels: args.labels,
      showBorders: args.borders,
      asciiMode: args.ascii,
      live: false,
    });
    process.stdout.write(output);
    process.stdout.write(RESET + '\n');
  }
}

const RESET = '\x1b[0m';

function runLive(args, countries) {
  // State object that input handlers can mutate
  const state = {
    theme: args.theme,
    zoom: args.zoom,
    centreLat: args.centreLat,
    centreLon: args.centreLon,
    projection: args.projection,
    grid: args.grid,
    labels: args.labels,
    borders: args.borders,
    ascii: args.ascii,
  };

  let rendering = false;

  function doRender() {
    if (rendering) return;
    rendering = true;

    const output = render({
      countries,
      themeName: state.theme,
      zoom: state.zoom,
      centreLon: state.centreLon,
      centreLat: state.centreLat,
      projection: state.projection,
      showGrid: state.grid,
      showLabels: state.labels,
      showBorders: state.borders,
      asciiMode: state.ascii,
      live: true,
    });

    process.stdout.write(output);
    rendering = false;
  }

  // Initial render
  doRender();

  // Re-render on resize
  process.stdout.on('resize', doRender);

  // Setup keyboard input
  setupInput(state, doRender);

  // Clean exit handlers
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

main();
