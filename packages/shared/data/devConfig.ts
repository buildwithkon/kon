const devConfig1 = {
  id: 'centrum',
  version: '0.1',
  url: 'centrum.kon.xyz',
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

const devConfig2 = {
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

const devConfig3 = {
  id: 'ethtokyo',
  version: '0.1',
  url: 'ethtokyo.kon.xyz',
  name: "ETHTokyo'25",
  description:
    'ETHTokyo is a engaging hackathon for the global Ethereum community where people with all sorts of backgrounds, ideas, and skills come together to share their love for Ethereum and its world.',
  template: {
    type: 'event',
    tabs: [
      {
        id: 'home',
        title: 'Home',
        icon: 'ph-house',
        content: 'md:https://hackmd.io/@yujiym/BkWsINrp1e/download'
      },
      {
        id: 'conf',
        title: 'Conference',
        icon: 'ph-megaphone',
        content: 'md:https://hackmd.io/@yujiym/SkvoWc86yx/download'
      },
      {
        id: 'hackathon',
        title: 'Hackathon',
        icon: 'ph-laptop',
        content: 'md:https://hackmd.io/@yujiym/rkVGH9UTkx/download'
      },
      {
        id: 'forum',
        title: 'Forum',
        content: 'xmtp:1111'
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

export const baseConfig = {
  id: 'appname',
  version: '0.1',
  url: 'appname.kon.xyz', // appname is same as is
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

export const devConfig = devConfig3
