const { getNamedAccounts, ethers } = require("hardhat")

const Amount = ethers.utils.parseEther("0.0200");

async function getWeth() {
    // To call any function of any other other contract u will need to ABI & Contract Address
    const deployer = (await getNamedAccounts()).deployer;

    const IWeth = await ethers.getContractAt(
      "IWeth" /* This is the ABI path */,
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      deployer
    );

    const tx = await IWeth.deposit({ value: Amount });
    await tx.wait(1);

    const wethBalance = await IWeth.balanceOf(deployer);
    console.log(`The Weth balance is ${wethBalance}`);
}

module.exports = { getWeth,Amount }