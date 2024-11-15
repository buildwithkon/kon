const devConfig1 = {
  id: 'centrum',
  version: '1.0',
  url: 'centrum.kon.xyz',
  name: 'Centrum',
  description: 'Global web3 Community Space in Shibuya',
  font: 'serif',
  icons: {
    favicon: 'https://i.imgur.com/OlCwNTn.png',
    logo: 'https://i.imgur.com/OlCwNTn.png'
  },
  colors: {
    main: '#2F2F2F'
  },
  plugins: {
    forum: true,
    points: true,
    notification: 'xmtp'
  }
}

const devConfig2 = {
  id: 'demo',
  version: '1.0',
  url: 'demo.kon.xyz',
  name: 'KON DEMO',
  description: 'Demo community app for ETHBangkok 2024 - build with KON',
  icons: {
    favicon: 'https://euc.li/sepolia/demo.kululu.eth',
    logo: 'https://euc.li/sepolia/demo.kululu.eth'
  },
  font: 'sans',
  colors: {
    main: '#FFB147'
  },
  plugins: {
    forum: true,
    points: true,
    notification: 'xmtp'
  }
}

export const devConfig = devConfig2
