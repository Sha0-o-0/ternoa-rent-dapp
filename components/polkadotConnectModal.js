import React, { useEffect } from 'react'

const PolkadotConnectModal = ({ isOpened, onClose, data, setSelectedAccount }) => {
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
        <div className='wallet-polka-main'>
          {data.map((node, index) => (
            <div
              className='wallet-polka'
              key={index}
              onClick={() => {
                setSelectedAccount(node.address)
                onClose()
              }}
            >
              {node.meta.name}
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  ) : null
}

export default PolkadotConnectModal
