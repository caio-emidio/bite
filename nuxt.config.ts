// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Bite — your food, your story',
      meta: [
        { name: 'description', content: 'A softer way to keep track of the meals that make up your day.' },
        { name: 'theme-color', content: '#f7f6f1' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ]
    }
  }
})
