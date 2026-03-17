/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-amber': 'var(--accent-amber)',
        'accent-green': 'var(--accent-green)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        'congestion-low': 'var(--congestion-low)',
        'congestion-mid': 'var(--congestion-mid)',
        'congestion-high': 'var(--congestion-high)',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
