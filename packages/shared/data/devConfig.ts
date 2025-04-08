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
    favicon: 'https://i.imgur.com/OlCwNTn.png',
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
    favicon: 'https://euc.li/sepolia/fine2024.kon.eth',
    logo: 'https://i.imgur.com/rxpmtxU.png'
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
        icon: 'ph-user-sound',
        content: 'md:https://hackmd.io/@yujiym/SkvoWc86yx/download'
      },
      {
        id: 'hackathon',
        title: 'Hackathon',
        icon: 'ph-code',
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
    favicon: 'https://i.imgur.com/3G9N6sa.png',
    logo: 'https://i.imgur.com/wzAQxaz.png'
  },
  font: 'sans',
  colors: {
    main: '#5E1913',
    accent: '#FF6476'
  }
}

export const devConfig = devConfig3
