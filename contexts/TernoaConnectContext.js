import { createContext, useCallback, useState, useEffect } from 'react'
import Client from '@walletconnect/sign-client'
import { ERROR } from '@walletconnect/utils'
import { isMobile as checkIsMobile } from '@walletconnect/legacy-utils'
import {
  cryptoWaitReady,
  decodeAddress,
  signatureVerify
} from '@polkadot/util-crypto'
import { u8aToHex } from '@polkadot/util'
import TernoaConnectModal from '../components/ternoaConnectModal'
import { makeRentOfferTx, initializeApi, batchAllTx } from 'ternoa-js'

const DEFAULT_APP_METADATA = {
  name: 'CapsTools Rent Dapp',
  description: "Rent Ternoa's NFTnodes Easily",
  url: 'https://www.capstools.app/',
  icons: ['https://www.capstools.app/favicon.ico']
}

const TERNOA_CHAIN = process.env.CHAIN

export const TernoaConnectContext = createContext()

export const TernoaConnectContextProvider = ({ children }) => {
  const [client, setClient] = useState()
  const [pairings, setPairings] = useState([])
  const [session, setSession] = useState()
  const [isInitializing, setIsInitializing] = useState()
  const [account, setAccount] = useState()
  const [isAccountValidated, setIsAccountValidated] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [modalURI, setModalURI] = useState()
  const [isValidateAccountRetryVisible, setIsValidateAccountRetryVisible] =
    useState(false)

  const isConnected = !!session
  const isMobile = checkIsMobile()

  const reset = () => {
    setPairings([])
    setSession(undefined)
    setAccount(undefined)
    setIsAccountValidated(false)
  }

  const isValidSignaturePolkadot = (signedMessage, signature, address) => {
    const publicKey = decodeAddress(address)
    const hexPublicKey = u8aToHex(publicKey)
    return signatureVerify(signedMessage, signature, hexPublicKey).isValid
  }

  const onSessionConnected = useCallback(_session => {
    const account = Object.values(_session.namespaces)
      .map(namespace => namespace.accounts)
      .flat()[0]
      .split(':')[2]
    setSession(_session)
    setAccount(account)
    console.log('connected', _session, account)
  })

  const connect = useCallback(
    async pairing => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      try {
        const requiredNamespaces = {
          ternoa: {
            chains: [TERNOA_CHAIN],
            events: ['ternoa:1'],
            methods: ['sign_transaction']
          }
        }
        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces: requiredNamespaces
        })
        if (uri) {
          if (!isMobile) {
            setModalURI(uri)
          } else {
            window.location.replace(`ternoa-wallet://wc?uri=${uri}`)
          }
        }
        const session = await approval()
        console.log('Established session:', session)
        onSessionConnected(session)
      } catch (e) {
        console.error(e)
      } finally {
        setModalURI(undefined)
      }
    },
    [client, onSessionConnected]
  )

  const disconnect = useCallback(async () => {
    console.log('disconnect', session)
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    if (typeof session === 'undefined') {
      throw new Error('Session is not connected')
    }

    await client.disconnect({
      topic: session.topic,
      reason: ERROR.USER_DISCONNECTED.format()
    })
    reset()
  }, [client, session])

  const subscribeToEvents = useCallback(
    async _client => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      _client.on('session_update', ({ topic, params }) => {
        const { namespaces } = params
        const _session = _client.session.get(topic)
        const updatedSession = { ..._session, namespaces }
        onSessionConnected(updatedSession)
      })
      _client.on('session_delete', () => {
        reset()
      })
    },
    [onSessionConnected]
  )

  const checkPersistedState = useCallback(
    async _client => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      _client.pairing?.keys?.forEach(
        async key => await _client.pairing.delete(key, 'a')
      )

      if (typeof session !== 'undefined') return
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1
        const _session = _client.session.get(_client.session.keys[lastKeyIndex])
        await onSessionConnected(_session)
        return _session
      }
    },
    [session, onSessionConnected]
  )

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true)
      const _client = await Client.init({
        relayUrl: 'wss://wallet-connectrelay.ternoa.network/',
        projectId: '',
        metadata: DEFAULT_APP_METADATA
      })
      await subscribeToEvents(_client)
      await checkPersistedState(_client)
      setClient(_client)
    } catch (err) {
      throw err
    } finally {
      setIsInitializing(false)
    }
  }, [checkPersistedState, subscribeToEvents])

  const makeRentOffer = useCallback(
    async (nftId, contractCreationBlockId) => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }

      await initializeApi(process.env.NETWORK)

      const tx = await makeRentOfferTx(nftId, contractCreationBlockId)

      setIsLoading(true)
      await client
        .request({
          chainId: TERNOA_CHAIN,
          topic: session.topic,
          request: {
            method: 'sign_transaction',
            params: {
              pubKey: account,
              request: {
                hash: tx,
                nonce: -1,
                submit: true
              }
            }
          }
        })
        .then(async response => {
          const { txHash } = JSON.parse(response)
          if (txHash) {
            console.log('OK')
          }
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    },
    [client, session, account]
  )

  const batchAll = useCallback(
    async nodes => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }

      await initializeApi(process.env.NETWORK)
      var allTx = []
      for (let i = 0; i < nodes.length; i++) {
        if (
          nodes[i].contract !== null &&
          nodes[i].isRented == false &&
          !nodes[i].contract.rentOffers.includes(account)
        ) {
          const txExtrinsic = await makeRentOfferTx(
            nodes[i].nftId,
            nodes[i].contract.creationBlockId
          )
          allTx.push(txExtrinsic)
        }
      }

      if (allTx.length > 0) {
        const hashBatchTx = await batchAllTx(allTx)

        setIsLoading(true)
        await client
          .request({
            chainId: TERNOA_CHAIN,
            topic: session.topic,
            request: {
              method: 'sign_transaction',
              params: {
                pubKey: account,
                request: {
                  hash: hashBatchTx,
                  nonce: -1,
                  submit: true
                }
              }
            }
          })
          .then(async response => {
            const { txHash } = JSON.parse(response)
            if (txHash) {
              console.log('OK')
            }
            setIsLoading(false)
          })
          .catch(() => {
            setIsLoading(false)
          })
      } else {
        window.alert('nothing to batch')
      }
    },
    [client, session, account]
  )

  useEffect(() => {
    if (!client) {
      createClient()
    }
  }, [client, createClient])

  return (
    <TernoaConnectContext.Provider
      value={{
        pairings,
        isInitializing,
        isConnected,
        account,
        client,
        session,
        connect,
        disconnect,
        makeRentOffer,
        batchAll,
        isLoading
      }}
    >
      <TernoaConnectModal
        isOpened={!!modalURI}
        uri={modalURI}
        onClose={() => {
          setModalURI(undefined)
        }}
      />
      {children}
    </TernoaConnectContext.Provider>
  )
}
