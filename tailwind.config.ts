import type { Config } from 'tailwindcss'

/**
 * Palette lifted from the live site. #2f5aae is the theme-color meta tag on
 * every existing page, so it is the anchor for the whole system.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2f5aae',
          50: '#eef3fb',
          100: '#d9e4f6',
          200: '#b7cbec',
          300: '#8aaade',
          400: '#5c85cd',
          500: '#2f5aae',
          600: '#284d95',
          700: '#213e78',
          800: '#1b325f',
          900: '#16274b',
        },
        accent: {
          DEFAULT: '#f5a623',
          600: '#d98c0f',
        },
        // Elementor's own "secondary" global colour on the live site — used
        // on the header marquee. Distinct from `brand` (the theme-color).
        secondary: '#004aad',
        ink: {
          DEFAULT: '#1a1a1a',
          muted: '#5b6472',
          light: '#8b95a3',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f6f8fb',
          border: '#e4e9f0',
        },
        whatsapp: '#25d366',
      },
      // The live site (Neve theme default) never loads a web font — it's
      // plain Arial/Helvetica at 15px root. Matching that exactly rather
      // than the Inter Google Font this build previously loaded.
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      maxWidth: {
        content: '1140px',
        prose: '760px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        'card-hover': '0 8px 24px rgba(16, 24, 40, 0.10)',
        float: '0 4px 16px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
