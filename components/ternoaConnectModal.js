import { QRCodeSVG } from 'qrcode.react'
import React, { useEffect } from 'react'

const TernoaConnectModal = ({ isOpened, onClose, uri }) => {
  useEffect(() => {
    if (isOpened) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpened])

  return isOpened ? (
    <React.Fragment>
      <div className='modal-main' onClick={() => onClose && onClose()} />
      <div className='modal-top'>
        <div className='title'>Scan with your Ternoa Wallet</div>
        <div className='modal-qrcode'>
          <QRCodeSVG value={uri} size={300} />
        </div>
      </div>
    </React.Fragment>
  ) : null
}

export default TernoaConnectModal
