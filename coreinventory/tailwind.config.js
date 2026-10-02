/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', '"PT Serif"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        // Dark muted slate palette — no harsh brights
        bg:       '#181a1d',
        surface:  '#1f2227',
        card:     '#252930',
        border:   '#2e333d',
        // Warm muted amber-brown accent
        accent:   '#9c8060',
        accentLt: '#b89a74',
        accentDk: '#6b5840',
        // Muted semantic
        success:  '#4e7c5f',
        danger:   '#7d4040',
        warning:  '#7d7030',
        info:     '#3e5e7a',
        // Text
        muted:    '#525866',
        dim:      '#7e8694',
        text:     '#bfc3cc',
        textLt:   '#dde0e6',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease both',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'drift-in': 'driftIn 0.4s ease both',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0, transform:'translateY(6px)' },  to:{ opacity:1, transform:'translateY(0)' } },
        slideUp: { from:{ opacity:0, transform:'translateY(18px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        driftIn: { from:{ opacity:0, transform:'translateX(-6px)' }, to:{ opacity:1, transform:'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
