# Oracle Parachain Robonomics

## Project setup

```
yarn install
```

### Compiles for production

```
yarn build
```

### Configuration ENV

```
ETH_CHAIN_API=wss://mainnet.infura.io/ws/v3/PROJECT_ID,
ROBONOMICS_CHAIN_API=wss://rpc.parachain.robonomics.network
CONTRACT=0x3BD98A58930eE3a360493aA081758b36E263Bd49
ORACLE=//Alice
```

### Run

```
node dist/index.js
node dist/cron.js
```
