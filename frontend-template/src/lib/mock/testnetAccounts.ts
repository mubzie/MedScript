export const TESTNET_ACCOUNTS = {
  pharmacist: {
    id: '0xb524a2d9a8db6f00101ac2dfcd9251',
    label: 'Demo Pharmacist',
    network: 'testnet'
  },
  doctor: {
    id: '0xc8eeb68ff5481e0001a4dd9df4ff36',
    label: 'Demo Doctor',
    network: 'testnet'
  },
  senderWallet: {
    id: '0x5ee718cbda8ab80052616dcf10fc53',
    label: 'Sender Wallet',
    network: 'testnet'
  }
}

export const TESTNET_TRANSACTIONS = [
  {
    label: 'Sender Init',
    hash: '0xc399bd54221a352acffc20fd2ec57be3e134bdc2d699e56b0f62aa552eff9f1f',
    explorerUrl: 'https://testnet.midenscan.com/tx/0xc399bd54221a352acffc20fd2ec57be3e134bdc2d699e56b0f62aa552eff9f1f'
  },
  {
    label: 'Prescription Published',
    hash: '0x40e18742f7550c9b29575c3f95565d9d2548cac3017d67e7703ab22b61a425d3',
    explorerUrl: 'https://testnet.midenscan.com/tx/0x40e18742f7550c9b29575c3f95565d9d2548cac3017d67e7703ab22b61a425d3'
  },
  {
    label: 'Doctor Consumed Note',
    hash: '0x349f08f3e0c4ab1638d638fbf089873a7970f0030e6bbd24fb0099a34f4dcfd6',
    explorerUrl: 'https://testnet.midenscan.com/tx/0x349f08f3e0c4ab1638d638fbf089873a7970f0030e6bbd24fb0099a34f4dcfd6'
  },
  {
    label: 'Fulfillment Published',
    hash: '0x5a7ddb817fec21e9a01a7589e9dcf0384ae0067f19ee8378921fbf97161e6bdb',
    explorerUrl: 'https://testnet.midenscan.com/tx/0x5a7ddb817fec21e9a01a7589e9dcf0384ae0067f19ee8378921fbf97161e6bdb'
  },
  {
    label: 'Pharmacist Consumed Fulfillment',
    hash: '0x9108f6a934eeda35fedade3f53bc9a8bf78a397c4b3eed0cb89bdad8d48c98ef',
    explorerUrl: 'https://testnet.midenscan.com/tx/0x9108f6a934eeda35fedade3f53bc9a8bf78a397c4b3eed0cb89bdad8d48c98ef'
  }
]
