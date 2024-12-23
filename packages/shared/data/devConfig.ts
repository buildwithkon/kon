const devConfig1 = {
  id: 'centrum',
  version: '1.0',
  url: 'centrum.kon.xyz',
  name: 'Centrum',
  description: 'Global web3 Community Space in Shibuya',
  font: 'sans',
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
  id: 'alpha',
  version: '1.0',
  url: 'alpha.kon.xyz',
  name: 'Alpha Club',
  description: 'This is an experimental space for KON Alpha.',
  icons: {
    favicon: 'https://kon.xyz/static/favicon.png',
    logo: 'https://kon.xyz/static/favicon.png'
  },
  font: 'serif',
  colors: {
    main: '#C5F900'
  },
  plugins: {
    xmtp: 'xGqF3kCJXOfGLetv67hTh',
    points: '0x6D884056B5aded7FC77B6d975b13E0210b490ad6'
  }
}

export const devConfig = devConfig1
