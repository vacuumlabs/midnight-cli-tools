# Midnight CLI Tools

This repository is a compendium of tools, libs and contracts, used to learn more about the midnight network.
Tools and utilities are primarily targeted for easier development and debugging the contracts and work with midnight network,
and should not be used in production environment.

Code is structured in such way, to expose each concept individually, allowing quick overview how to do (or not to do) things.

## Installation

Clone the repo, while initializing the submodules:
```bash
$ git clone --recurse-submodules https://github.com/vacuumlabs/midnight-cli-tools.git
$ git clone --recurse-submodules git@github.com:vacuumlabs/midnight-cli-tools.git
```

If you already cloned the repo, but without submodules, you can initialize them with:

```bash
$ git submodule update --init --recursive
```

After that, just install the dependencies, included libraries and contracts:
```bash
$ npm i
$ npm run build
```

Each implemented tool, has its own section in this doc how to use it, with its own README describing supported commands in detail.

## Apps

All implemented apps have npm script with same name as the name of the tool, and another one with the prefix `sa-*`. Tooling, by default targets the
[testnet environment](https://midnight.network/blog/introducing-the-midnight-testnet). The `sa-` variants will run against local standalone network, simplifying 
the work with the tools.

### wallet-cli
Tooling allowing to work with a Midnight wallet from the command line. Allowing same functionality as the Lace wallet with additional
functionality, allowing CLI scripting and convenience. Read more [here](./apps/wallet-cli/README.md).

### contract-cli
Tooling aggregating common contract operations. Currently supports only pre-compiled contract stored in the [contract lib](./libs/contract/src/loadedContracts.ts).
More info about supported commands [here](./apps/contract-cli/README.md).

### vesting-cli
Specialized CLI tool, specifically made to work with [vesting smart contract](./contracts/vest/src/Index.compact).

## Environments
The testnet environment is slow, often unavailable and often just broken. For better experience I suggest you using a standalone network. This is a single node running on local computer, acting as an independent network.

### Setting up standalone network

#### Build pre-baked ZK server
The default proof server that is suggested to be used with midnight, come with pre-baked parameter up to complexity of 15. The vestment circuit `claim`
has complexity of `k=16`. The proof server often fails to download correct parameters, and interactions with this contract is impossible without those 
parameters, as all calls to the circuit will fail, as the transaction cannot be proved. For this, it is required to build a proof server with pre-baked parameters
that are download during building of the image.

First, make sure that the submodules are initialized and up-to-date:

```bash
$ git submodule update --init --recursive
```
Check that folder `midnight-proof-server` exists, and is non-empty, and that it contains a `Dockerfile`.

Then build the image, executing this command in the root directory:

```bash
$ docker build -f midnight-proof-server/Dockerfile --build-arg CIRCUIT_PARAM_RANGE="10 11 12 13 14 15 16" -t midnight-proof-server:prebaked ./midnight-proof-server
```

#### Run the standalone images

Then just run docker-compose to run all required images:

```bash
$ docker compose -f ./standalone.docker-compose.yml up -d
```

Make sure that the components are up and running. In you browser go to:
```
localhost:6300
loclahost:9944
localhost:8088/health
```
You should see a positive message there.

#### Wallet setup and obtaining tDust

There is no dev faucet for the standalone network. Only way to obtain tDust, is to transfer it from the genesis wallet. There is a scrip included to simply do so:

```bash
$ npm run create-standalone-genesis-wallet
```

You should see a new file created in the root directory called `genesis.sa.wallet.json`. You can easily transfer funds from this wallet using the [wallet-cli](./apps/wallet-cli/README.md):

```bash
$ npm run sa-wallet-cli -- generate -o my.wallet.json --seed 56620405c44b20effc617e66bff8f4f58ac15f2ab0cc0d7ee08a1a1a381dbb3d
$ npm run sa-wallet-cli -- transfer --wallet ./genesis.sa.wallet.json --receiver mn_shield-addr_undeployed1229xz8d0atn5lay5kw9gsv5s2hrtlwmr3n345u924u8r3zllvprsxqxu3dlzq0g5v4qcs7dv8ehv79a47hj4utkwmm5m46cdur2srtyfzvh7xmwu --amount 1000000
```

Or you can just use genesis wallet instead of own wallet, there is no mnemonics for it, so you cannot interoperate it with Lace wallet from browser.
