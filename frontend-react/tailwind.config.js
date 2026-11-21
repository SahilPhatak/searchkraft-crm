/** @type {import('tailwindcss').Config} */
// Tailwind is used for utilities only. Preflight (the base reset) is OFF so
// production's stylesheet (src/styles/app.css) stays the single source of the look.
// Colour names point straight at production's CSS variables, so shadcn/Radix
// components automatically render in production colours (light + dark).
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--border)',
        ring: 'var(--accent)',
        background: 'var(--surface)',
        foreground: 'var(--fg)',
        primary: { DEFAULT: 'var(--accent)', foreground: '#ffffff' },
        secondary: { DEFAULT: 'var(--surface2)', foreground: 'var(--fg)' },
        destructive: { DEFAULT: 'var(--red)', foreground: '#ffffff' },
        muted: { DEFAULT: 'var(--surface2)', foreground: 'var(--fg3)' },
        accent: { DEFAULT: 'var(--accent-bg)', foreground: 'var(--accent)' },
        popover: { DEFAULT: 'var(--surface)', foreground: 'var(--fg)' },
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--fg)' },
      },
      borderRadius: { lg: '10px', md: '8px', sm: '6px' },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
