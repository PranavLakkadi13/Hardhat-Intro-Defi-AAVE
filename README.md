``` shell 
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv
```
-> add the required dependencies 
-> try running the below tasks 
``` shell 
yarn hardhat run scripts/aaveBorrow.js 
```

Everthing will be done programatically interacting with the AAVE contracts:

Also we will be forking the mainnet:

1. Deposit collateral: ETH / WETH 
2. Borrow another asset: DAI
3. Repay the collateral  