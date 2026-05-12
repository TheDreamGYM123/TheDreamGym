---
name: The Dream Gym
colors:
  surface: '#15130a'
  surface-dim: '#15130a'
  surface-bright: '#3c392e'
  surface-container-lowest: '#100e06'
  surface-container-low: '#1e1c11'
  surface-container: '#222015'
  surface-container-high: '#2c2a1f'
  surface-container-highest: '#373529'
  on-surface: '#e8e2d1'
  on-surface-variant: '#cdc7ad'
  inverse-surface: '#e8e2d1'
  inverse-on-surface: '#333025'
  outline: '#96917a'
  outline-variant: '#4b4734'
  surface-tint: '#dec724'
  primary: '#fffeff'
  on-primary: '#383100'
  primary-container: '#fbe342'
  on-primary-container: '#716400'
  inverse-primary: '#6b5f00'
  secondary: '#e6d02d'
  on-secondary: '#373100'
  secondary-container: '#c9b400'
  on-secondary-container: '#4f4600'
  tertiary: '#fffeff'
  on-tertiary: '#333125'
  tertiary-container: '#e7e2d1'
  on-tertiary-container: '#676457'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#fce443'
  primary-fixed-dim: '#dec724'
  on-primary-fixed: '#201c00'
  on-primary-fixed-variant: '#514700'
  secondary-fixed: '#fbe442'
  secondary-fixed-dim: '#dec823'
  on-secondary-fixed: '#201c00'
  on-secondary-fixed-variant: '#504700'
  tertiary-fixed: '#e8e2d1'
  tertiary-fixed-dim: '#cbc6b6'
  on-tertiary-fixed: '#1d1c11'
  on-tertiary-fixed-variant: '#49473b'
  background: '#15130a'
  on-background: '#e8e2d1'
  surface-variant: '#373529'
typography:
  display-xl:
    fontFamily: Epilogue
    fontSize: 96px
    fontWeight: '800'
    lineHeight: 90%
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Epilogue
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 100%
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 110%
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 160%
    letterSpacing: 0em
  body-sm:
    fontFamily: Epilogue
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 150%
    letterSpacing: 0em
  label-caps:
    fontFamily: Epilogue
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 100%
    letterSpacing: 0.15em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

The design system is defined by a "Dark Cinematic Luxury" aesthetic. It targets high-performance individuals who view fitness as an elite, near-spiritual pursuit. The visual narrative balances the raw intensity of a high-end training facility with the refined, hushed atmosphere of a private members' club.

The style leverages **Glassmorphism** and **High-Contrast Minimalist** principles. Surfaces are treated like smoked glass—dark, translucent, and layered—to create a sense of infinite depth. This design system evokes an emotional response of focus, prestige, and relentless momentum. It mimics the "flow state" of an athlete through smooth transitions, blurred backgrounds, and sharp, high-energy accents that cut through the darkness like stadium lights.

## Colors

The palette is anchored in deep, "obsidian" tones. The primary backgrounds use **Matte Black** and **Deep Dark Brown** to establish a heavy, premium foundation that reduces eye strain and emphasizes content.

**Neon Gold Yellow** serves as the "Ignition" color, used sparingly for critical calls to action and performance metrics to simulate high energy. **Warm Golden** provides a sophisticated secondary accent for interactive states. Typography relies on **Soft Cream** to ensure legibility without the harshness of pure white, maintaining the luxurious, low-light ambiance of the brand.

## Typography

The typography in this design system is aggressive and editorial. Using **Epilogue** across all levels ensures a modern, geometric consistency. 

Headlines must be "massive"—dominating the viewport to create a cinematic impact. Tight letter spacing (kerning) is required for all bold headings to create a dense, powerful visual block. Labels and overlines are strictly uppercase with increased letter spacing to provide a technical, functional contrast to the expressive display type. Body text remains clean and open, prioritizing readability against dark, textured backgrounds.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** with generous outer margins to reinforce the "Luxury" feel—white space (or in this case, "black space") is treated as a premium commodity. 

Layouts should favor asymmetrical compositions that feel dynamic, like an athlete in motion. Vertical rhythm is built on an 8px base unit, with large gaps between sections (120px+) to allow the cinematic imagery and glass components room to breathe. Components should be grouped in "performance clusters" using tighter internal spacing (16px-24px) while maintaining large external margins.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and light-emissive properties rather than traditional shadows. 

1.  **Smoked Glass Surfaces:** Secondary containers use a 60%–80% opacity fill of Rich Graphite with a heavy backdrop blur (20px–40px).
2.  **Thin Border Glows:** Instead of drop shadows, cards use a 1px solid border. Active or featured elements receive a subtle outer glow (neon-gold) with a 0.5px stroke at 30% opacity.
3.  **Z-Axis Layering:** Content should appear to float at different levels of focus. Elements further back are darker and more blurred; primary interactive elements are crisp with higher saturation accents.

## Shapes

The design system utilizes **Rounded XL corners** to soften the industrial nature of the color palette, making the interface feel more organic and approachable. 

The standard border radius is 16px (`rounded-lg`), while main containers and cards utilize a 24px (`rounded-xl`) radius. Small interactive elements like checkboxes or mini-tags may use a smaller 8px radius, but sharp 0px corners are strictly prohibited to maintain the "Equinox-style" fluidity.

## Components

### Buttons
*   **Primary:** Solid Neon Gold Yellow fill, black text, 800 weight. No border. On hover, a subtle outer glow expands.
*   **Ghost/Secondary:** Transparent background with a 1px Soft Cream border. Text in Soft Cream. On hover, the background fills with a 10% opacity cream.

### Cards
*   **Performance Cards:** Rich Graphite background at 40% opacity, 30px backdrop blur. 1px border in Muted Gray (20% opacity). 
*   **Featured Cards:** Same as performance but with a 1px border gradient from Neon Gold to Transparent.

### Input Fields
*   **Style:** Underlined or fully enclosed glass containers. 
*   **Focus State:** The bottom border or full border transitions to Neon Gold Yellow with a faint 4px blur "aura" around the field.

### Progress Bars
*   **Track:** Matte Black or Deep Dark Brown.
*   **Indicator:** A vibrant gradient from Warm Golden to Neon Gold. For "Elite" status levels, add a shimmering animation to the indicator.

### Chips & Tags
*   **Visuals:** Small, pill-shaped, uppercase text. Used for "Training Level" or "Equipment Needed." Borders should be extremely thin (0.5px).