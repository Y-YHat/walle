# Walle project notes

- Bilingual EN/BG site for Bulgarian high-schoolers (15–18) learning AI. Playful/bold vibe: Unbounded + Manrope, cream canvas, cobalt/pink/lime/yellow, blob backgrounds, 2px ink borders + offset shadows.
- IMPORTANT: relative subresources (CSS/JS files) DO NOT load in the preview — only the requested HTML file is served. Shared styles/JS must be INLINED into every page. `walle.css` and `walle.js` at project root are the source of truth; after editing them, re-inline into all pages with run_script (replace the `<style>`/`<script>` blocks marked "Walle shared").
- Pages (renamed for web hosting — clean lowercase URLs, index.html is the entry point): index.html (landing: hero + interactive demo + lesson cards + fine-print teaser), prompting.html, spot-the-fakes.html, make-things.html, ai-for-school.html, fine-print.html.
- i18n: every translatable element carries data-en/data-bg attrs; lang choice persists in localStorage key `walle-lang`. Quiz engine `WalleQuiz` lives in walle.js.
- User is a native Bulgarian speaker and will polish BG copy themselves — don't rewrite their edits.
