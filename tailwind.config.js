/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}",
            './dist/**/*.{html,js}'
  ],
  safelist: [
    'bg-white',
    'border-b',
    'dark:bg-gray-800',
    'dark:border-gray-700',
    'hover:bg-gray-50',
    'dark:hover:bg-gray-600',
    // Agrega todas las clases necesarias
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
