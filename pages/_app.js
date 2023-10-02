import { TernoaConnectContextProvider } from '../contexts/TernoaConnectContext'
import '../styles/globals.css'

function MyApp ({ Component, pageProps }) {
  return (
    <TernoaConnectContextProvider>
      <Component {...pageProps} />
    </TernoaConnectContextProvider>
  )
}

export default MyApp
