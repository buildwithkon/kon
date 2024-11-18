# Build with KON

![Build with KON](resources/kon-header.png)

> A ETHGlobal Bangkok 2024 hackathon project.

`Build with KON` simplifies launching community PWA apps, leveraging composability of web3 with ENS, Passkey wallet, XMTP.

## Concept

`Build with KON` is a template designed to facilitate the launch of a community PWA app. Think of it as a WordPress-like solution tailored for PWA apps.

We aim to empower community owners with control over app creation and management while enhancing composability and interoperability.

With this template, owners can define app settings directly through ENS text record, allowing for seamless app deployment. Moreover, ENS records store app configuration data and its update history, ensuring transparency and traceability.

Users can log in effortlessly using their Passkey Wallets. Thanks to ENS subnames, user management becomes streamlined, enabling access to a suite of web3 functionalities without the need to manage or even be aware of a wallet.

## How it's made

- [PWA app (Cloudflare Workers)](packages/pwa): remix on cloudflare workers, read app's config from ENS text record and launch app
- [Smart Wallets](https://www.coinbase.com/wallet/smart-wallet): Using coinbase's smartwallet, wallet creation by passkey, tx signing, and user-operated Sponsored Transactions by [CDP](https://www.coinbase.com/developer-platform)
- [ENS text record (sepolia testnet)](https://app.ens.domains/demo.kon.eth?tab=records): Managing app config (`app.kon` text record)
- [ENS Subnames (sepolia testnet)](https://app.ens.domains/demo.kon.eth?tab=subnames): Managing app users
- `XMTP`: Group creation for app users, fostering community through group chats, with bots managing app point tipping.
- WIP
  - `Owner dashboard`: We are planning to create admin dashboard for owners later, including editing page for ENS, a list of users, and create a Safe multisig for owner management.

## Architecture

![KON Architecture](resources/kon-architecture.png)

## Deployment
- App Point Feature
  - [AppPointFactory](https://sepolia.basescan.org/address/0x85876aD496a12c6563A6A01fb41a89ff58CAEC71#code)
  - [AppPoint (for DEMO)](https://sepolia.basescan.org/address/0x6D884056B5aded7FC77B6d975b13E0210b490ad6#code)
- ENS L2 Subnames (durin.dev)
  - [ENS L2Registory](https://sepolia.basescan.org/address/0x5550a769d1f8f583fce3ed4f87ee1102ab99b764#code)
  - [ENS L2Registory](https://sepolia.basescan.org/address/0x5550a769d1f8f583fce3ed4f87ee1102ab99b764#code)
  - [ENS L1Resolver](https://sepolia.etherscan.io/address/0x00f9314C69c3e7C37b3C7aD36EF9FB40d94eDDe1#code)
