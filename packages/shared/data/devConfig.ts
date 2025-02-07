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
  id: 'fine2024',
  version: '0.1',
  url: 'fine2024.kon.xyz',
  name: 'FINE2024',
  description: 'Fracton Incubation 2024 Demoday (IRL & Online)',
  template: {
    type: 'event',
    tabs: [
      { id: 'home', content: 'md:https://hackmd.io/@yujiym/BJRcrQQK1g/download' },
      { id: 'info', title: 'Information', content: 'md:https://hackmd.io/@yujiym/BJRcrQQK1g/download' },
      { id: 'qa', title: 'Q & A', content: 'iframe:https://app.sli.do/event/hSquYpgsUtoCKLCuEiBrjf' },
      { id: 'forum', title: 'Forum', content: 'xmtp:xxx' },
      { id: 'misc', title: 'Misc', content: 'md:https://hackmd.io/@yujiym/BJRcrQQK1g/download' }]
  },
  icons: {
    favicon: 'https://euc.li/sepolia/fine2024.kon.eth',
    logo: 'https://euc.li/sepolia/fine2024.kon.eth'
  },
  font: 'sans',
  colors: {
    main: '#121212',
    accent: '#04E348',
    background: '#121212'
  }
}

export const devConfig = devConfig2
