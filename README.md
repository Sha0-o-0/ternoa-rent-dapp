# Rent Dapp by CapsTools

Visit https://www.capstools.app/ to explore Ternoa's blockchain NFTs and Wallets Data.

This project was developed as an example to show how you can create a dapp for any use case on ternoa blockchain.

It uses :  
- **ternoa-js** - Ternoa SDK to create, batch and submit transactions
- **@polkadot/extension-dapp** - To connect with polkadot.js extension
- **@polkadot/api** - To create, batch, submit transactions
- **@walletconnect** - To generate URI and connect with Ternoa Wallet
- **Ternoa Indexer** - To get all NFT rental data
- **Ternoa IPFS** - To get NFT properties and media

## What is the dapp for ?

This rent dapp was built to permit anyone from Ternoa Community to make rent offers easely on The Nft Nodes collection (345)  
It can run on alphanet or mainnet on the specified collection

## How to use online

Go to https://rent-dapp.capstools.app/  
- Connect either from Ternoa wallet (mobile) or polkadot JS extension (desktop)
- Make single offers on NFTs
- Rent All in batch - will build a batch transaction for all rent contracts
- Sign using polkadotjs extension or Ternoa wallet


## Run it yourself

Configure .env file

```bash
npm install
npm run dev
```

## Env variables

*Alphanet*

```
CHAIN='ternoa:18bcdb75a0bba577b084878db2dc2546'
INDEXER='https://indexer-alphanet.ternoa.dev/'
NETWORK=''
COLLECTION='882'
PROVIDER='wss://alphanet.ternoa.com'
IPFS_KEY=''
IPFS='https://ipfs-dev.trnnfr.com/'
```

*Mainnet*

```
CHAIN='ternoa:6859c81ca95ef624c9dfe4dc6e3381c3'
INDEXER='https://indexer-mainnet.ternoa.dev/'
NETWORK='wss://mainnet.ternoa.network'
COLLECTION='345'
PROVIDER='wss://mainnet.ternoa.network'
IPFS_KEY=''
IPFS='https://ipfs-mainnet.trnnfr.com/'
```

## Disclaimer

This dapp is for educational purpose  
Developed in a matter of hours  
You may find coding errors  
Not audited for security issues

