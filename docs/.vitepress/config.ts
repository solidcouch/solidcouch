import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  title: 'SolidCouch',
  description: 'Open Your Doors, Own Your Data.',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'matrix', link: 'https://matrix.to/#/#solidcouch:matrix.org' },
      { icon: 'github', link: 'https://github.com/solidcouch/solidcouch' },
    ],
  },
  head: [['link', { rel: 'icon', href: 'logo.svg' }]],
  ignoreDeadLinks: 'localhostLinks',
})
