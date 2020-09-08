import React from 'react'

// @ts-ignore
import { Transaction, MemoryAccount, ChainNode, ContractCompilerAPI, Contract } from '@aeternity/aepp-sdk'
// @ts-ignore
import { Crypto } from '@aeternity/aepp-sdk/es'
import { contract as sourceCode } from './contracts/LoanContract.js'

const NODE_URL = 'https://sdk-testnet.aepps.com'

const INTERNAL_URL = 'http://localhost:3001'
const COMPILER_URL = 'http://localhost:3080' // required for using Contract
//const ACCOUNT = MemoryAccount({ keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' } })
//const fs = require('fs');

class Main extends React.Component {

  constructor(props: any) {
    super(props)
    this.state = {
      account: {
        secretKey: '',
        publicKey: ''
      },
      deployResult: '',
      byteCode: ''
    }
  }

  generateAccount() {
    const {secretKey, publicKey} = Crypto.generateKeyPair()
    console.log(secretKey, publicKey)
    this.setState({account: {
      secretKey,
      publicKey
    }})
  }

  async compileContract () {
    // @ts-ignore
    const { account } = this.state
    const { secretKey } = account
    // @ts-ignore
    const ContractWithAe = await Contract
      .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
      .compose(ContractCompilerAPI) // ContractBase implementation
    const client = await ContractWithAe({ url: NODE_URL, internalUrl: INTERNAL_URL, compilerUrl: COMPILER_URL, keypair: account })
    console.log("before")
    const { bytecode: byteCode } = await client.contractCompile(sourceCode)
    console.log("after")
    this.setState({byteCode, sourceCode})
  }

  async deployContract () {
    // @ts-ignore
    const { account, byteCode, sourceCode } = this.state
    const { secretKey } = account
    const ContractWithAe = await Contract
      .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
      .compose(ContractCompilerAPI) // ContractBase implementation
    const client = await ContractWithAe({ url: NODE_URL, internalUrl: INTERNAL_URL, compilerUrl: COMPILER_URL, keypair: account })

    const collateralAddr = ''
    const stablecoinAddr = ''

    const deployed = await client.contractDeploy(byteCode, sourceCode, [collateralAddr, stablecoinAddr])

    this.setState({deployResult: JSON.stringify(deployed)}) 
  }


  render() {
    // @ts-ignore
    const { account, deployResult, byteCode } = this.state
    const { secretKey, publicKey } = account
    return (
      <div>      
        <div>
          <button onClick={() => this.generateAccount()}>
          Generate New
          </button>
        </div>
        <div>
          <h5>SecretKey: {secretKey}</h5>
          <h5>SecretKey: {publicKey}</h5>
        </div>
        <div>
          <button onClick={() => this.compileContract()}>
          compileContract
          </button>
          <h5>Compile Result: {byteCode}</h5>
        </div>
        <div>
          <button onClick={() => this.deployContract()}>
          deployContract
          </button>
          <h5>Deploy Result: {deployResult}</h5>
        </div>
      </div>


    

    );
  }
}

export default Main