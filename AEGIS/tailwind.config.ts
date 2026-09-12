/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space': {
          950: '#030508',
          900: '#050810',
          850: '#070c16',
          800: '#0a1020',
          700: '#0f172a',
          600: '#1e293b',
        },
        'ai': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        'mem': {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        'ent': {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        'act': {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        'danger': {
          400: '#f87171',
          500: '#ef4444',
        },
        'warn': {
          400: '#fb923c',
          500: '#f97316',
        },
        'success': {
          400: '#4ade80',
          500: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ai-glow': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.15)',
        'ai-glow-lg': '0 0 40px rgba(59, 130, 246, 0.5), 0 0 100px rgba(59, 130, 246, 0.2)',
        'mem-glow': '0 0 15px rgba(20, 184, 166, 0.4)',
        'ent-glow': '0 0 15px rgba(139, 92, 246, 0.4)',
        'act-glow': '0 0 15px rgba(245, 158, 11, 0.4)',
        'glass': '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
