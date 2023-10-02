import { request, gql } from 'graphql-request'
import { TernoaIPFS } from 'ternoa-js'

export async function getNodeNftsData () {
  const query = gql`
    query rent {
      collectionEntities(filter: { collectionId: { equalTo: "${process.env.COLLECTION}" } }) {
        nodes {
          nftEntitiesByCollectionId {
            totalCount
            nodes {
              nftId
              isRented
              rentalContractId
              rentee
              offchainData
              rentalContract {
                rentOffers
                nbRentOffers
                acceptanceType
                timestampStarted
                startBlockId
                blockDuration
                rentFeeRounded
                timestampEnded
                creationBlockId
              }
            }
          }
        }
      }
    }
  `

  const ipfsClient = new TernoaIPFS(
    new URL(process.env.IPFS),
    process.env.IPFS_KEY
  )

  const response = await request(process.env.INDEXER, query)
  var nodeNfts = []
  if (response) {
    if (
      response?.collectionEntities?.nodes[0]?.nftEntitiesByCollectionId?.nodes
    ) {
      const data =
        response.collectionEntities.nodes[0].nftEntitiesByCollectionId.nodes
      for (let i = 0; i < data.length; i++) {
        var contract = null
        if (data[i].rentalContract !== null) {
          const dateStart = new Date(data[i].rentalContract.timestampStarted)
          const timeEnd =
            dateStart.getTime() +
            data[i].rentalContract.blockDuration * 6 * 1000
          contract = {
            rentFeeRounded: data[i].rentalContract.rentFeeRounded,
            creationBlockId: data[i].rentalContract.creationBlockId,
            blockDuration: data[i].rentalContract.blockDuration,
            startBlockId: data[i].rentalContract.startBlockId,
            timeRemain: timeRemaining(timeEnd),
            nbRentOffers:
              data[i].rentalContract.nbRentOffers == null
                ? 0
                : data[i].rentalContract.nbRentOffers,
            rentOffers: data[i].rentalContract.rentOffers
          }
        }
        var isRented = data[i].isRented
        if (data[i].rentee == null) {
          isRented = false
        }

        const ipfsData = await ipfsClient.getFile(data[i].offchainData)

        nodeNfts.push({
          nftId: data[i].nftId,
          isRented: isRented,
          contract: contract,
          media: ipfsData
            ? `${process.env.IPFS}ipfs/${ipfsData.properties.media.hash}`
            : ''
        })
      }
    }
  }

  return nodeNfts
}

function timeRemaining (input) {
  const formatter = new Intl.RelativeTimeFormat('en')
  const d1 = new Date()
  const dateUTC = new Date(
    d1.getUTCFullYear(),
    d1.getUTCMonth(),
    d1.getUTCDate(),
    d1.getUTCHours(),
    d1.getUTCMinutes(),
    d1.getUTCSeconds()
  )
  const ranges = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1
  }
  const secondsElapsed = (input - dateUTC.getTime()) / 1000
  for (let key in ranges) {
    if (ranges[key] < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / ranges[key]
      return formatter.format(Math.round(delta), key)
    }
  }
}
