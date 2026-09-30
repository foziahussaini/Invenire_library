// tailwind.config.js
module.exports = {
  content: [
    "./**/*.{html,js}",        // scan everything in the project root and subfolders
    "./src/**/*.{html,js}",    // adjust if you keep files elsewhere
    "./pages/**/*.{html,js}"
  ],
  theme: {
    screens: {
      'xxs': '320px',
      'xs' : '480px',
      'sm' : '640px',
      'md' : '768px',
      'lg' : '1024px',
      'xl' : '1280px',
      '2xl': '1536px'
    },
    extend: {}
  },
  plugins: []
};