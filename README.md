# Creosmark

A character sheet builder tool for Sunder players to use online.

## Features

### Campaign Sessions (NEW!)

Connect with other players in real-time to share roll results using peer-to-peer connections.

**Key Features:**
- **Session Creation**: GMs can create sessions with shareable 6-character codes
- **Join Sessions**: Players join with a simple session code
- **Real-time Roll Sharing**: All skill rolls are broadcast to connected players
- **Player List**: See all connected players with their names and avatars
- **Activity Log**: View recent rolls from all players
- **Session Persistence**: Connection persists across page navigation
- **No Server Required**: Direct peer-to-peer connections via WebRTC

See [CAMPAIGN_SESSIONS.md](CAMPAIGN_SESSIONS.md) for detailed usage instructions.

### Potential Track Component

A custom web element (`<potential-track>`) for tracking character potential scores with stress and resistance mechanics.

**Key Features:**
- **Main Score Display**: Central number showing the character's potential score
- **Semi-Halo Nodes**: Surrounding nodes equal to the score, arranged in a semicircle
- **Stress Tracking**: Queue-style tracking from the left side (red nodes)
- **Resistance Tracking**: Queue-style tracking from the right side (green nodes)
- **Constraint Validation**: Ensures stress + resistance never exceeds the score
- **Keyboard Accessible**: Full keyboard navigation support
- **Themeable**: CSS custom properties for easy customization

## Installation

Simply include the component in your HTML:

```html
<script type="module" src="src/components/potential-track.js"></script>
<link rel="stylesheet" href="src/css/potential-track.css">
```

## Usage

### Basic Usage

```html
<potential-track score="10" stress="0" resistance="0"></potential-track>
```

### JavaScript API

```javascript
const track = document.querySelector('potential-track');

// Properties
track.score = 10;        // Set the total potential score
track.stress = 2;        // Set stress level (must respect constraint)
track.resistance = 1;    // Set resistance level (must respect constraint)

// Methods
track.addStress();       // Add 1 stress (returns true if successful)
track.removeStress();    // Remove 1 stress (returns true if successful)
track.addResistance();   // Add 1 resistance (returns true if successful)
track.removeResistance(); // Remove 1 resistance (returns true if successful)

// Events
track.addEventListener('stress-changed', (e) => {
  console.log(e.detail); // { stress, resistance, score }
});

track.addEventListener('resistance-changed', (e) => {
  console.log(e.detail); // { stress, resistance, score }
});
```

### Themes

Add theme classes to customize appearance:

```html
<!-- Default dark theme -->
<potential-track score="10"></potential-track>

<!-- Light theme -->
<potential-track class="light-theme" score="10"></potential-track>

<!-- Fantasy/parchment theme -->
<potential-track class="fantasy-theme" score="10"></potential-track>

<!-- Size variations -->
<potential-track class="small" score="10"></potential-track>
<potential-track class="large" score="10"></potential-track>
```

### CSS Custom Properties

Customize the component using CSS custom properties:

```css
potential-track {
  --potential-center-bg: #1a1a2e;
  --potential-center-stroke: #4a4a6a;
  --potential-score-color: #e0e0e0;
  --potential-node-empty: #2a2a4a;
  --potential-node-stroke: #5a5a8a;
  --potential-stress-fill: #8b0000;
  --potential-stress-stroke: #ff4444;
  --potential-resistance-fill: #004d00;
  --potential-resistance-stroke: #44ff44;
  --potential-font: 'Georgia', serif;
}
```

## Running the Demo

Start a local server to view the demo:

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Running Tests

```bash
npm test
```

## Project Structure

```
creosmark/
├── index.html                    # Demo page
├── package.json                  # Project configuration
├── README.md                     # This file
├── src/
│   ├── components/
│   │   └── potential-track.js   # The Potential Track web component
│   └── css/
│       └── potential-track.css  # Theme styles
└── tests/
    └── potential-track.test.js  # Unit tests
```

## Browser Support

This project uses Web Components (Custom Elements v1), which are supported in all modern browsers:
- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## License

MIT
