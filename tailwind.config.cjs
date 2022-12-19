/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    ...new Array(10).fill('').map((_, i) => `h-${i*2+12}`),
    ...new Array(6).fill('').map((_, i) => `border-${i*2+8}`)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
