import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"Fira Code"', 'monospace'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg:          '#07080D',
        surface:     '#0E1018',
        'surface-2': '#141720',
        'surface-3': '#1A1E2A',
        lime:        '#C8F135',
        'lime-dim':  'rgba(200,241,53,0.09)',
        teal:        '#2DD4BF',
        'teal-dim':  'rgba(45,212,191,0.1)',
        amber:       '#FBBF24',
        'amber-dim': 'rgba(251,191,36,0.1)',
        rose:        '#F43F5E',
        'rose-dim':  'rgba(244,63,94,0.1)',
        muted:       '#7B8099',
        'muted-2':   '#3D4257',
      },
    },
  },
  plugins: [],
}
export default config
