# TERA: Tamper-Proof Digital Certificates

**TERA** (*Tanda Elektronik Resmi Autentik*, "Authentic Official Electronic Mark") is a system for issuing and verifying digital certificates whose authenticity is anchored on a blockchain. It was built as my undergraduate thesis project:

> *Design and Implementation of TERA, a Web3 Content Management System for Digital Certificates Using a Merkle Tree on the Monad Blockchain, for Tamper-Proof and Transparent Bulk Issuance.*

The app's interface is in Indonesian.

## The main idea

All the certificates from one event are squeezed into **one 32-byte Merkle root**, and that root is written to the blockchain in **one transaction**. That means:

| | |
|---|---|
| Issuing cost | Stays the same no matter how many people get a certificate |
| Personal data on the blockchain | None, only hashes |
| Verifying a certificate | Anyone can check it directly against the network, **no crypto wallet needed** |
| Revoking a certificate | Recorded permanently and auditable |

**What's a Merkle root?** Think of it as a fingerprint of a whole list. Change even one certificate in the list and the fingerprint changes. Each person gets a short "proof" that their certificate is part of the list, and the contract can check that proof against the stored fingerprint.

## Measured results

Gas used by `terbitkanBatch` (issue a batch) for different batch sizes:

| Certificates in the batch | Gas |
|---|---|
| 10 | 26,575 |
| 1,000 | 26,575 |
| 100,000 | 26,576 |
| 1,000,000 | 26,576 |

That's a **0% difference**. These are internal execution gas numbers; a full transaction measured **50,932 gas** (including the base fee, calldata, and cold storage access).

Compared with sending one transaction per certificate at N = 100,000, this is **171,552× cheaper**.

## Network

The contract runs on the **Monad testnet** (chain ID 10143):

- Contract: [`0xb7a00687762d15212f73ffa164723a23252174ad`](https://testnet.monadexplorer.com/address/0xb7a00687762d15212f73ffa164723a23252174ad)

## Tech stack

| Layer | Tools |
|---|---|
| Contract | Solidity 0.8.28, Foundry, OpenZeppelin |
| App | SvelteKit 2, Svelte 5, Bun |
| Blockchain | viem, OpenZeppelin Merkle Tree |
| Documents | pdf-lib, W3C Verifiable Credentials |

## Run it

You need [Bun](https://bun.sh) and [Foundry](https://getfoundry.sh).

**Local mode**: no setup needed; uses a local blockchain (Anvil):

```bash
./jalankan-web.sh            # open http://localhost:5173
BERSIH=1 ./jalankan-web.sh   # start from a clean slate
```

**Network mode**: uses the real testnet:

```bash
cp apps/web/.env.example apps/web/.env   # fill in KUNCI_TX (the transaction signing key)
./cek-env.sh                             # check the configuration
./deploy-jaringan.sh                     # deploy the contract
./jalankan-web.sh
```

(`jalankan-web` = run web, `cek-env` = check env, `deploy-jaringan` = deploy to network.)

## Tests

```bash
cd contracts && forge test               # 33 tests, including fuzz tests
cd apps/web  && bun test                 # 28 tests
cd apps/web  && bun run scripts/asap.ts  # browser-style smoke test
```

The most important test is `contracts/test/MerkleKompatibilitas.t.sol`: it checks that Merkle proofs generated in TypeScript are accepted by the Solidity contract.

## Project structure

```
contracts/          Smart contract (Foundry)
apps/web/           SvelteKit app
  src/lib/          Credentials, Merkle tree, templates (shared by server and browser)
  src/lib/server/   Data store, issuing, PDF generation, login
  src/routes/       Public pages, participant portal, admin panel, explorer
plan.md             Full design, specification, and measurements
```

## Notes

This is a thesis prototype. Data is still stored in JSON files rather than PostgreSQL, and login sessions are kept in memory.

## License

MIT
