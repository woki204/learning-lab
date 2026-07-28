import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base חייב להתאים לשם הריפו כדי ש-GitHub Pages יטען את הנכסים נכון
export default defineConfig({
  plugins: [react()],
  base: '/learning-lab/',
})
