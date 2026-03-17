/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'oklch(0.620 0.200 40)',
					hover: 'oklch(0.560 0.200 40)',
					active: 'oklch(0.510 0.200 40)',
					subtle: 'oklch(0.620 0.200 40 / 12%)',
					border: 'oklch(0.620 0.200 40 / 35%)',
				},
				accent: 'oklch(0.700 0.180 45)',
				danger: {
					DEFAULT: 'oklch(0.577 0.245 27.325)',
					hover: 'oklch(0.520 0.245 27.325)',
					subtle: 'oklch(0.577 0.245 27.325 / 12%)',
				},
				success: {
					DEFAULT: 'oklch(0.627 0.194 142.5)',
					subtle: 'oklch(0.627 0.194 142.5 / 12%)',
				},
				warning: {
					DEFAULT: 'oklch(0.769 0.188 70.08)',
					subtle: 'oklch(0.769 0.188 70.08 / 12%)',
				},
				info: {
					DEFAULT: 'oklch(0.623 0.214 259.815)',
					subtle: 'oklch(0.623 0.214 259.815 / 12%)',
				},
			},
			borderRadius: {
				xs: '0.25rem',
				sm: '0.35rem',
				md: '0.55rem',
				lg: '0.75rem',
				xl: '1.15rem',
				'2xl': '1.55rem',
			},
			fontFamily: {
				sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
				mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			boxShadow: {
				xs: '0 1px 2px oklch(0 0 0 / 8%)',
				sm: '0 1px 4px oklch(0 0 0 / 10%), 0 1px 2px oklch(0 0 0 / 6%)',
				md: '0 4px 12px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 6%)',
				lg: '0 8px 24px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%)',
				primary: '0 2px 8px oklch(0.620 0.200 40 / 30%)',
				'primary-lg': '0 4px 16px oklch(0.620 0.200 40 / 35%)',
			},
			transitionDuration: {
				fast: '100ms',
				base: '150ms',
				slow: '250ms',
			},
		},
	},
	plugins: [],
};
