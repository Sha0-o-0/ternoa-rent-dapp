/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  env: {
    CHAIN: process.env.CHAIN,
    INDEXER: process.env.INDEXER,
    NETWORK: process.env.NETWORK,
    COLLECTION: process.env.COLLECTION,
    PROVIDER: process.env.PROVIDER,
    IPFS_KEY: process.env.IPFS_KEY,
    IPFS: process.env.IPFS
  }
}

module.exports = nextConfig
