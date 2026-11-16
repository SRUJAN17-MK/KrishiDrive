/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // KrishiDrive Modern Agri-Tech Palette
        midnight: {
          DEFAULT: '#07172F',
          50: '#E6EDF5',
          100: '#C5D5E8',
          200: '#91B0D6',
          300: '#5D8BC4',
          400: '#306AB5',
          500: '#064FAE', // Electric Blue
          600: '#05408F',
          700: '#043270',
          800: '#092147',
          900: '#07172F', // Midnight Navy Core
          950: '#030B17'
        },
        electric: {
          DEFAULT: '#064FAE',
          50: '#EBF4FF',
          100: '#D6E8FF',
          200: '#ADCFFF',
          300: '#75AFFF',
          400: '#388BFF',
          500: '#064FAE',
          600: '#054294',
          700: '#04367A',
          800: '#072E63',
          900: '#0A254E'
        },
        bright: {
          DEFAULT: '#0785E8',
          50: '#F0F8FF',
          100: '#E0F1FE',
          200: '#BAE2FD',
          300: '#7DCCFC',
          400: '#38B1FA',
          500: '#0785E8',
          600: '#0670C4',
          700: '#055BA0',
          800: '#084D83',
          900: '#0C416C'
        },
        amber: {
          DEFAULT: '#FF9800',
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FF9800', // Golden Amber
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100'
        },
        warmgold: {
          DEFAULT: '#F5A623',
          400: '#F7B74E',
          500: '#F5A623',
          600: '#DC8E12',
          700: '#B8740B'
        },
        charcoal: {
          DEFAULT: '#111827',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#111827', // Charcoal Panel Core
          950: '#0B0F19'
        },
        muted: '#A7B4C5',
        offwhite: '#F8FAFC',
        // Compatibility bridge: map forest & agri to modern electric/navy so no existing class breaks
        forest: {
          50: '#E6EDF5',
          100: '#C5D5E8',
          200: '#91B0D6',
          300: '#5D8BC4',
          400: '#306AB5',
          500: '#064FAE',
          600: '#05408F',
          700: '#043270',
          800: '#092147',
          900: '#07172F',
          950: '#030B17'
        },
        agri: {
          50: '#EEF7FF',
          100: '#D9EEFF',
          200: '#B8DEFF',
          300: '#85C7FE',
          400: '#4CAAFB',
          500: '#0785E8',
          600: '#066EC2',
          700: '#05579C',
          800: '#07457A',
          900: '#07172F'
        },
        gold: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
