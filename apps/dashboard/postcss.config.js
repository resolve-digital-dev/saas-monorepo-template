export default {
  plugins: {
    // Tailwind v4 moved the PostCSS plugin into its own package and now
    // handles vendor prefixing itself, so autoprefixer is gone.
    '@tailwindcss/postcss': {},
  },
};
