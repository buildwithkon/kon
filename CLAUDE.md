# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KON is a No-code On-chain App Framework for building Progressive Web Apps (PWAs) with blockchain integration. It enables users to deploy decentralized applications with built-in tokenomics and messaging capabilities via XMTP.

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Copy environment files for each package before running
cp templates/pwa/.dev.vars.example templates/pwa/.dev.vars
cp packages/api/.dev.vars.example packages/api/.dev.vars
cp packages/xmtp-agent/.env.example packages/xmtp-agent/.env
```

### Running Services
```bash
# Run PWA template
pnpm @pwa run dev

# Run API service
pnpm @api run dev

# Run XMTP agent
pnpm @agent run dev

# Run landing site
pnpm @site run dev
```

### Smart Contract Development
```bash
# Run from packages/contracts directory
cd packages/contracts

# Install Foundry dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy contracts (requires .env configuration)
forge script script/DeployFactory.s.sol --broadcast --verify
```

### Code Quality
```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Check formatting
pnpm run check
```

## Architecture

### Monorepo Structure
- **`packages/api`**: Cloudflare Workers API using Hono framework for ENS operations
- **`packages/contracts`**: Smart contracts (AppCoin.sol, AppCoinFactory.sol) using Foundry
- **`packages/xmtp-agent`**: XMTP messaging bot with Coinbase AgentKit and LangChain integration
- **`packages/shared`**: Shared TypeScript utilities for ENS, wallet operations, ABIs
- **`packages/shared-react`**: Shared React components and hooks for Web3 integration
- **`packages/site`**: Landing page using React Router on Cloudflare Workers
- **`templates/pwa`**: PWA template with React Router v7, Wagmi, Viem, and XMTP

### Key Technologies
- **Frontend**: React 19, React Router v7, TailwindCSS v4, Vite PWA
- **Blockchain**: Base network (mainnet & sepolia), Viem, Wagmi
- **Messaging**: XMTP protocol for decentralized messaging
- **AI**: OpenAI, Coinbase AgentKit, LangChain for agent capabilities
- **Infrastructure**: Cloudflare Workers with Wrangler

### Smart Contract Architecture
- **AppCoin.sol**: ERC20 token with admin controls, tipping mechanism, and reward redemption
- **AppCoinFactory.sol**: Factory pattern for deploying new AppCoin instances
- Uses OpenZeppelin v5.3 for security and standard implementations

### Network Configuration
- **Production**: kon.xyz (Base Mainnet)
- **Staging**: kon.wtf (Base Sepolia)
- ENS subdomains: Apps get `.kon.eth` subdomains

## Key Features Implementation

### XMTP Agent Capabilities
The agent handles:
- App setup and configuration
- ENS subdomain management
- Coin deployment and management
- Wallet interactions via messaging

### PWA Template Features
- Offline support via Vite PWA plugin
- Web3 wallet connection with Wagmi
- XMTP messaging integration
- Cloudflare Workers deployment

## Environment Variables

### API Service (.dev.vars)
- `ENSCHAIN`: Base chain ID for ENS operations
- `RESOLVER_ADDRESS`: ENS resolver contract address

### XMTP Agent (.env)
- `OPENAI_API_KEY`: For AI capabilities
- `XMTP_KEY`: XMTP private key
- `CDP_API_KEY_NAME` & `CDP_API_KEY_PRIVATE_KEY`: Coinbase Developer Platform credentials
- `NETWORK_ID`: Network configuration

### PWA Template (.dev.vars)
- `AUTH_DOMAIN` & `AUTH_CLIENT_ID`: Authentication configuration
- Various API keys for Web3 services

## Code Style Guidelines
- Uses Biome for formatting and linting
- React hooks must have exhaustive dependencies
- Avoid using array indices as keys in React
- Follow existing patterns in each package