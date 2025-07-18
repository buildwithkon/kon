const DUMMY_REWARDS = [
  {
    title: '🏷️ 10% off ticket',
    description: '10% off next purchase',
    value: 1
  },
  {
    title: '☕ 1 free coffee',
    description: '1 free coffee next time',
    value: 10
  },
  {
    title: '💎 VIP',
    description: 'You are VIP',
    value: 10000
  }
]

export const devConfig1 = {
  id: 'centrum',
  version: '0.1',
  name: 'Centrum',
  description: 'Global web3 Community Space in Shibuya',
  template: {
    type: 'shop',
    tabs: ['home', 'shop', 'community', 'points', 'notifications', 'settings']
  },
  font: 'sans',
  icons: {
    logo: 'https://i.imgur.com/OlCwNTn.png'
  },
  colors: {
    main: '#2F2F2F'
  }
}

export const devConfig2 = {
  id: 'fine3',
  version: '0.1',
  url: 'fine3.kon.xyz',
  name: 'FINE3',
  description: 'DemoDay for Fracton Incubation Cohort 3',
  template: {
    type: 'event',
    tabs: [
      {
        id: 'home',
        title: 'Home',
        icon: 'ph-house',
        content: 'md:https://hackmd.io/@yujiym/BJRcrQQK1g/download'
      },
      {
        id: 'info',
        title: 'Information',
        content: 'md:https://hackmd.io/58Pt6mAvTjCrXiNsMpmAZw/download'
      },
      { id: 'qa', title: 'Q & A', content: 'iframe:https://app.sli.do/event/hSquYpgsUtoCKLCuEiBrjf' },
      { id: 'forum', title: 'Forum', content: 'xmtp:xxx' },
      {
        id: 'misc',
        title: 'Misc',
        icon: 'ph-text-indent',
        content: 'md:https://hackmd.io/@yujiym/BkOGAVIt1g/download'
      }
    ]
  },
  icons: {
    logo: 'https://euc.li/sepolia/fine2024.kon.eth',
    logoBgTransparent: 'https://i.imgur.com/rxpmtxU.png'
  },
  font: 'sans',
  colors: {
    main: '#121212',
    accent: '#04E348'
  }
}

export const devConfig3 = {
  id: 'ethtokyo',
  version: '0.1',
  name: "ETHTokyo'25",
  description: 'Emancipatory Tech for the Future of Humanity',
  template: {
    type: 'pwa',
    tabs: [
      {
        id: 'home',
        title: 'Home',
        icon: 'ph-house',
        content: 'md:https://hackmd.io/@yujiym/BkWsINrp1e/download'
      },
      {
        id: 'agenda',
        title: 'Agenda',
        icon: 'ph-calendar-dots',
        content:
          'ical:https://calendar.google.com/calendar/ical/c_14dfbc731f48db1e6b25a6603fb2a34eed7d6d7d8828ea82d5ea7c96c695bd57%40group.calendar.google.com/public/basic.ics'
      },
      {
        id: 'forum',
        title: 'Forum',
        content: 'xmtp:7c8f2a71a8baa86cf73cef61c9b0df55'
      },
      {
        id: 'info',
        title: 'Information',
        icon: 'ph-text-indent',
        content: 'md:https://hackmd.io/@yujiym/BydSuqUa1x/download'
      }
    ]
  },
  icons: {
    logo: 'https://i.imgur.com/3G9N6sa.png',
    logoBgTransparent: 'https://i.imgur.com/wzAQxaz.png'
  },
  font: 'sans',
  colors: {
    main: '#562266',
    accent: '#FF5545'
  }
}

export const devConfig4 = {
  id: 'wassiecoffee',
  version: '0.1',
  name: 'Wassie Coffee',
  site: 'https://wassiecoffee.xyz',
  description:
    'What Wassie Coffee Will Do: \n☕ Share top-tier coffee roastery insights \n🌍 Organize IRL coffee stands & roastery tours during crypto events worldwide',
  template: {
    type: 'pwa',
    tabs: [
      {
        id: 'home',
        title: 'Home',
        content: ''
      },
      {
        id: 'forum',
        title: 'Forum',
        content: 'xmtp:7c8f2a71a8baa86cf73cef61c9b0df55'
      },
      {
        id: 'misc',
        title: 'Information',
        content: 'md:https://hackmd.io/@yujiym/ByO2Pqt7lx/download'
      }
    ]
  },
  icons: {
    logo: 'https://raw.githubusercontent.com/9dai5/wassiecoffee/refs/heads/main/0194f33c-f19f-7dad-bf2d-a7d5435ffd0f.jpeg'
  },
  font: 'sans',
  colors: {
    main: '#6D3A11',
    accent: '#4BE3E5'
  },
  coin: {
    chainId: 8453,
    address: '0xe1310e9ba4b0ce0665834bdfdc96cf7efb68bfd5'
  },
  rewards: DUMMY_REWARDS
}

export const baseConfig = {
  id: 'appname',
  version: '0.1',
  name: 'App Name', // use title tag
  description: 'App Description', // use meta description tag
  template: {
    type: 'event', // 'event' | 'shop'
    tabs: [
      {
        id: 'home',
        title: 'Home',
        content: '#Info' // markdown content
      },
      {
        id: 'forum',
        title: 'Forum',
        content: 'xmtp:1111'
      },
      {
        id: 'info',
        title: 'Information',
        content: '#Info' // markdown content
      }
    ]
  },
  icons: {
    logo: 'https://i.imgur.com/3G9N6sa.png', // get logo from site
    logoBgTransparent: 'https://i.imgur.com/wzAQxaz.png' // get logo with transparent background from site optional
  },
  font: 'sans', // 'sans' | 'serif' | 'dot' | 'mono'
  colors: {
    main: '#562266', // main color of the app, used for background and primary elements
    accent: '#FF5545' // accent color of the app, used for background and primary elements
  }
}

export const dummyRoles = {
  schema: 'eas:0x0000000000000000000000000000000000000000',
  lists: [
    { id: 'admin', label: '🛡️ Admin' },
    { id: 'stuff', label: '✏️ Stuff' },
    { id: 'dev', label: '👤 Developer' }
  ]
}

export const devConfig = devConfig3
