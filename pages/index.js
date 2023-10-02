import Head from 'next/head'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { ApiPromise, WsProvider } from '@polkadot/api'
import PolkadotConnectModal from '../components/polkadotConnectModal'
import { getNodeNftsData } from '../utils/requests'
import { useTernoaConnect } from '../hooks/useTernoaConnect'

export default function Home () {
  const [nodeNfts, setNodeNfts] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [walletList, setWalletList] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const { connect, disconnect, account, makeRentOffer, batchAll } =
    useTernoaConnect()

  const getData = async () => {
    setNodeNfts(false)
    const data = await getNodeNftsData()
    setNodeNfts(data)
  }

  const getDataBatch = async () => {
    const data = await getNodeNftsData()
    setNodeNfts(data)
  }

  async function disconnectWallet () {
    setSelectedAccount(null)
  }

  const connectWallet = async () => {
    const { web3Enable, web3Accounts } = await import(
      '@polkadot/extension-dapp'
    )
    const extensions = web3Enable('CapsTools')

    if (!extensions) {
      throw Error('No Extension Found')
    }

    const allAccounts = await web3Accounts()

    if (allAccounts.length > 0) {
      setWalletList(allAccounts)
      setModalOpen(true)
    } else {
      window.alert('No extension detected')
    }
  }

  const makeOfferPolka = async (nftId, creationBlockId) => {
    const { web3FromSource } = await import('@polkadot/extension-dapp')
    const provider = new WsProvider(process.env.PROVIDER)
    const api = await ApiPromise.create({ provider })

    const transferExtrinsic = api.tx.rent.makeRentOffer(nftId, creationBlockId)
    const injector = await web3FromSource('polkadot-js')
    transferExtrinsic
      .signAndSend(
        selectedAccount,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              window.alert(`${nftId} - ${creationBlockId} - transaction failed`)
            } else {
              window.alert(
                `${nftId} - ${creationBlockId} - Transaction Completed with hash ${status.hash.toString()}`
              )
            }
          } else {
            console.log(`Current status: ${status.type}`)
          }
        }
      )
      .catch(error => {
        window.alert(`${nftId} - ${creationBlockId} - transaction failed`)
      })
  }

  const batchAllPolka = async () => {
    const { web3Enable, web3Accounts, web3FromSource } = await import(
      '@polkadot/extension-dapp'
    )
    const provider = new WsProvider(process.env.PROVIDER)
    const api = await ApiPromise.create({ provider })

    var allTx = []
    const nodes = nodeNfts
    for (let i = 0; i < nodes.length; i++) {
      if (
        nodes[i].contract !== null &&
        nodes[i].isRented == false &&
        !nodes[i].contract.rentOffers.includes(selectedAccount)
      ) {
        const txExtrinsic = api.tx.rent.makeRentOffer(
          nodes[i].nftId,
          nodes[i].contract.creationBlockId
        )
        allTx.push(txExtrinsic)
      }
    }
    if (allTx.length > 0) {
      const injector = await web3FromSource('polkadot-js')
      api.tx.utility
        .batch(allTx)
        .signAndSend(
          selectedAccount,
          { signer: injector.signer },
          ({ status, dispatchError }) => {
            if (status.isInBlock) {
              if (dispatchError) {
                window.alert(`batch All - transaction failed`)
              } else {
                window.alert(
                  `batch All - Transaction Completed with hash ${status.hash.toString()}`
                )
              }
            } else {
              console.log(`Current status: ${status.type}`)
            }
          }
        )
        .catch(error => {
          window.alert(`batch All - transaction failed`)
        })
    } else {
      window.alert('nothing to batch')
    }
  }

  const batchAllWallet = async () => {
    const nodes = nodeNfts
    batchAll(nodes)
  }

  useEffect(() => {
    getData()
  }, [account, selectedAccount])

  return (
    <div className='container'>
      <Head>
        <title>Rent Dapp</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main>
        <div className='visit-wrapper'>
          <a
            className='visit'
            href='https://www.capstools.app/'
            rel='noreferrer'
            target='_blank'
          >
            Explore Ternoa with CapsTools{' '}
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} height={'0.9em'} />
          </a>
        </div>
        <div className='main-top'>
          {!account ? (
            <button
              onClick={() => {
                connect()
              }}
            >
              Connect with Ternoa Wallet
            </button>
          ) : (
            <button
              onClick={() => {
                disconnect()
              }}
            >
              Disconnect Ternoa Wallet
              <br />({account.substring(0, 5) + '...' + account.slice(-5)})
            </button>
          )}
          {!selectedAccount ? (
            <button
              onClick={() => {
                connectWallet()
              }}
            >
              Connect with PolkadotJs
            </button>
          ) : (
            <button
              onClick={() => {
                disconnectWallet()
              }}
            >
              Disconnect PolkadotJs
              <br />(
              {selectedAccount.substring(0, 5) +
                '...' +
                selectedAccount.slice(-5)}
              )
            </button>
          )}
        </div>
        <div className='button-refresh'>
          {(account || selectedAccount) && (
            <div className='button-batch'>
              <button
                onClick={() => {
                  getDataBatch()
                  if (selectedAccount) {
                    batchAllPolka()
                  } else {
                    batchAllWallet()
                  }
                }}
              >
                Rent All in Batch
              </button>
            </div>
          )}
        </div>
        <div>
          {'This dapp is using indexer and can have up to 30 seconds delay'}
        </div>
        <div className='button-refresh'>
          <button
            onClick={() => {
              getData()
            }}
          >
            Refresh
          </button>
        </div>

        <div className='nft-wrapper'>
          {nodeNfts
            ? nodeNfts.map((node, index) => (
                <div className='nft' key={index}>
                  <img src={node.media} />
                  <div>{node.nftId}</div>
                  <div className='orange-color'>
                    {node.isRented &&
                      node.contract !== null &&
                      `Rented (ends ${node.contract.timeRemain})`}
                  </div>
                  <div className='red-color'>
                    {node.contract == null && `No active contract`}
                  </div>
                  <div className='green-color'>
                    {!node.isRented && node.contract !== null && (
                      <>
                        <div>{`Active contract - ${node.contract.rentFeeRounded} $CAPS`}</div>
                        <div>{`Offers : ${node.contract.nbRentOffers}`}</div>
                      </>
                    )}
                  </div>
                  <div>
                    {(account || selectedAccount) && node.contract !== null && (
                      <>
                        {!node.isRented &&
                          !node.contract.rentOffers.includes(selectedAccount) &&
                          !node.contract.rentOffers.includes(account) && (
                            <button
                              onClick={() => {
                                if (selectedAccount) {
                                  makeOfferPolka(
                                    node.nftId,
                                    node.contract.creationBlockId
                                  )
                                } else {
                                  makeRentOffer(
                                    node.nftId,
                                    node.contract.creationBlockId
                                  )
                                }
                              }}
                            >
                              Make Offer
                            </button>
                          )}
                        {!node.isRented &&
                          (node.contract.rentOffers.includes(selectedAccount) ||
                            node.contract.rentOffers.includes(account)) && (
                            <button className='disabled'>Offer Sent</button>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))
            : 'Loading...'}
        </div>
      </main>
      <PolkadotConnectModal
        isOpened={!!modalOpen}
        data={walletList}
        onClose={() => {
          setModalOpen(false)
        }}
        setSelectedAccount={setSelectedAccount}
      />
    </div>
  )
}
