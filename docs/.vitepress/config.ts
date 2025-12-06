import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  title: 'SolidCouch',
  description:
    'Open Your Doors, Own Your Data: Decentralized hospitality exchange built on Solid Protocol.',
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Tired Bike', link: 'https://tired.bike' }],

    search: { provider: 'local' },

    sidebar: [
      {
        text: 'About',
        link: '/about',
      },
      {
        text: 'Instances',
        link: '/instances',
      },
      {
        text: 'Contribute',
        link: '/contribute',
      },
      {
        text: 'Configuration',
        link: '/configuration',
      },
      {
        text: 'Internationalization',
        link: '/i18n',
      },
      {
        text: 'Personas',
        link: '/personas',
      },
      {
        text: 'Architecture',
        items: [{ text: 'Messages', link: '/architecture/messages' }],
      },
    ],

    socialLinks: [
      { icon: 'matrix', link: 'https://matrix.to/#/#solidcouch:matrix.org' },
      { icon: 'github', link: 'https://github.com/solidcouch' },
    ],

    logo: 'logo.svg',
  },
  head: [
    ['link', { rel: 'icon', href: 'logo.svg' }],
    [
      'meta',
      { property: 'og:image', content: 'https://solidcouch.org/logo.png' },
    ],
    [
      'meta',
      { name: 'twitter:image', content: 'https://solidcouch.org/logo.png' },
    ],
  ],
  ignoreDeadLinks: 'localhostLinks',
})
