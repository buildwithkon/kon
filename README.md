# Build with KON

No-code On-chain App Framework

## Project structure

```
|--- packages
|------ api => API
|------ contracts => Smart Contracts
|------ shared => Shared ts lib
|------ shared-react => Shared react lib
|------ site => LP
|------ xmtp-agent => XMTP agent
|--- templates
|------ pwa => PWA app template
```

## Development

#### Install

```bash
pnpm install
```

#### Running PWA frontend app

```bash
# Setup env
cp ./templates/pwa/.dev.vars.example ./templates/pwa/.dev.vars
# Run
pnpm @pwa run dev
```

#### Running API

```bash
# Setup env
cp ./packages/api/.dev.vars.example ./packages/api/.dev.vars
# Run
pnpm @api run dev
```

#### Running XMTP agent

```bash
# Setup env
cp ./packages/xmtp-agent/.env.example ./packages/xmtp-agent/.env
# Run
pnpm @agent run dev
```


_TBU_

## Contribute

_TBU_
