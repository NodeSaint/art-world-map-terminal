'use strict';

// Handle keyboard input in live mode
function setupInput(state, render) {
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (key) => {
    const panAmount = 10 / state.zoom;

    switch (key) {
      // Quit
      case 'q':
      case '\u0003': // Ctrl+C
        cleanup();
        process.exit(0);
        break;

      // Arrow keys (escape sequences)
      case '\u001b[A': // Up
        state.centreLat = Math.min(85, state.centreLat + panAmount);
        render();
        break;
      case '\u001b[B': // Down
        state.centreLat = Math.max(-85, state.centreLat - panAmount);
        render();
        break;
      case '\u001b[C': // Right
        state.centreLon = Math.min(180, state.centreLon + panAmount);
        render();
        break;
      case '\u001b[D': // Left
        state.centreLon = Math.max(-180, state.centreLon - panAmount);
        render();
        break;

      // Zoom
      case '+':
      case '=':
        state.zoom = Math.min(10, state.zoom + 0.5);
        render();
        break;
      case '-':
      case '_':
        state.zoom = Math.max(1, state.zoom - 0.5);
        render();
        break;

      // Toggle theme
      case 't': {
        const themeNames = Object.keys(require('./themes').themes);
        const idx = themeNames.indexOf(state.theme);
        state.theme = themeNames[(idx + 1) % themeNames.length];
        render();
        break;
      }

      // Toggle grid
      case 'g':
        state.grid = !state.grid;
        render();
        break;

      // Toggle labels
      case 'l':
        state.labels = !state.labels;
        render();
        break;

      // Toggle borders
      case 'b':
        state.borders = !state.borders;
        render();
        break;

      // Reset
      case 'r':
        state.centreLat = 0;
        state.centreLon = 0;
        state.zoom = 1;
        render();
        break;
    }
  });
}

function cleanup() {
  // Restore terminal state
  process.stdout.write('\x1b[?25h');   // show cursor
  process.stdout.write('\x1b[0m');      // reset colours
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

module.exports = { setupInput, cleanup };
