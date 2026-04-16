export const CARD_SYMBOL_SVGS: Record<string, string> = {
    direct: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 12h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M11 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
    indirect: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 17c3-6 7-10 14-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M13 5h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
    reset: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 12a8 8 0 1 1-2.3-5.6" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M20 4v6h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`,
    duration: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M12 8v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,
    damage: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 2L5 14h5l-1 8 8-12h-5l1-8Z" fill="currentColor"/>
</svg>`,
    range: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
</svg>`,
    targeting: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="16" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,
    condition_minor: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3l8 4v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4Z" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,
    condition_major: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2l9 5v5c0 6-4 9-9 10-5-1-9-4-9-10V7l9-5Z" fill="currentColor"/>
</svg>`,
    primed: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,
    amplified: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,
    narrative: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 6h16v10H8l-4 4V6Z" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,
    generic: `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,
};