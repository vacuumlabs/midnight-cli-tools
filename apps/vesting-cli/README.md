# vesting-cli

CLI tooling for working with deployed [vesting contract](../../contracts/vest/src/Index.compact). This is specialization of
the [contract-cli](../contract-cli/README.md) specialized for creating, observing and claiming vestments.

## Prerequisites
This tool does not deploy the vesting contract, this needs to be done by using the [deploy command of contract-cli](../contract-cli/README.md#deploy) tool.
Deployed contract address, printed out is required as `--address` argument to this tool.

All commands also require the `--wallet` argument, which will be used to pay for the gas for calling the transactions.

## Create new vestment
New vestment is created in favor of provided beneficiary. The amount vested is charged to the currently supplied `--wallet`. Currently only ZSwap 
coin public key, can be used as target beneficiary. Using beneficiary address **is not supported** (as it is not possible to get the coin public key just from the wallet address), nor are **contract addresses** (as 
cross contract calls are not supported yet).

For testing, to figure out beneficiary coin public key, the [wallet sync] utility can be used:

```bash
$ wallet-cli sync --wallet ./my.wallet.json --paths coinPublicKey
```
Example output:
```
{
  coinPublicKey: 'mn_shield-cpk_test1k3wtlkkhwamaxz7wc6hqe43avjmv0h7j8wfy8tnhyjcjvn52s2jqu9sxrv'
}
```

Using this key, it is possible to create a new vestment.

```bash
$ vesting-cli createVestment --address $CONTRACT_ADDRESS --amount 1000000 --duration 3600 --beneficiary mn_shield-cpk_test1k3wtlkkhwamaxz7wc6hqe43avjmv0h7j8wfy8tnhyjcjvn52s2jqu9sxrv
```

Example output

```
New vestment created {
  vestmentId: 'c0ca265a87095d19b7e600f74097e6f73c836cfd4a736df9bb50cbe96e5b2b00',
  txInfo: {
    txHash: 'f67cc1a7d2dfd209f365d0f412bf5f4cc0f83f3f51e8127bd80e269087e230f6',
    txId: '0000000060d2d78b4e8768d615675feda0f2b8c24e3c94a6668aa3e396cc448f76e9b341',
    blockHash: 'bfa31123a3eea2d6fd113b5ea8ec6d741e5b0b998b88dbb91bb3536d350bf275',
    blockHeight: 8294
  }
}
```

## Get vestment info
The current version of the vestment contract, does not hide the public information about the vestment, so it is possible
to check the current state of the vestment, as long as, the vestmentId is known:

```bash
$ vesting-cli vestmentInfo --wallet ./other.wallet.json --address $CONTRACT_ADDRESS --vestmentId c0ca265a87095d19b7e600f74097e6f73c836cfd4a736df9bb50cbe96e5b2b00
```
Output:
```
Vestment info {
  vestmentId: 'c0ca265a87095d19b7e600f74097e6f73c836cfd4a736df9bb50cbe96e5b2b00',
  start: 2025-12-01T13:56:49.000Z,
  end: 2025-12-01T14:56:49.000Z,
  totalAmount: 1000000n,
  claimableAmount: 62777n,
  beneficiaryType: 'CoinPublicKey',
  beneficiary: 'mn_shield-cpk_test1k3wtlkkhwamaxz7wc6hqe43avjmv0h7j8wfy8tnhyjcjvn52s2jqu9sxrv',
  vestingCoin: {
    type: '02000000000000000000000000000000000000000000000000000000000000000000',
    nonce: '0031dd85c22aed82ff22718ced383792119d0b1349158f049a40887953a03e7e',
    value: 1000000n,
    mt_index: 67n
  }
}
```
## Claim
If the supplied wallet is the beneficiary (has same `coinPublicKey` as the beneficiary in the vestment), they are able to claim the already vested unclaimed amount from the coin.

```bash
$ vesting-cli claim --wallet ./other.wallet.json --address $CONTRACT_ADDRESS --vestmentId c0ca265a87095d19b7e600f74097e6f73c836cfd4a736df9bb50cbe96e5b2b00
```
Example output:
```
Claimed { claimedAmount: 247222n, remainingAmount: 752778n }
```

After claiming the vestment state updates, which can be checked with `vestmentInfo` command:

```
Vestment info {
  vestmentId: 'c0ca265a87095d19b7e600f74097e6f73c836cfd4a736df9bb50cbe96e5b2b00',
  start: 2025-12-04T13:56:49.000Z,
  end: 2025-12-04T14:56:49.000Z,
  totalAmount: 1000000n,
  claimableAmount: 27778n,
  beneficiaryType: 'CoinPublicKey',
  beneficiary: 'mn_shield-cpk_undeployed18qkkd6yeq77d5e8ykn4syk3pd6xwxkr6wzaqwgmskx4uakvjhx7sr5qz6t',
  vestingCoin: {
    type: '02000000000000000000000000000000000000000000000000000000000000000000',
    nonce: '5790c9d58c9df140ab1503fc5196501fa54488515ead8dee392cc63aaef76c00',
    value: 752778n,
    mt_index: 74n
  }
}
```
