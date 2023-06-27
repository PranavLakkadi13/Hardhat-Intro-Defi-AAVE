const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, Amount } = require("../scripts/getWETH");


async function main() {
  // The AAVE platform treats everything as a ERC-20
  // Therefore we use WETH since using ERC-20 For everything would be easy
  await getWeth();
  const deployer = (await getNamedAccounts()).deployer;

  // Lending Pool address providor -> address = 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // Lending pool address we get from the lending pool address providor ^
  const lendingPool = await getLendingPool(deployer);
  console.log(`the addres of the lending pool is ${lendingPool.address}`);

  // Deposit the money into the lending pool -->
  const WethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // But before we do that we need to approve the weth Token contract to approve it to the aave
  // lendingPool contract So that it can spend it on our behalf and and deposit onto the lendingPool

  // approve
  await approveERC(WethAddress, lendingPool.address, Amount, deployer);

  console.log("Depositing the WETH!!!");

  // Here we are depositing the WETH into the lendingpool contract
  await lendingPool.deposit(WethAddress, Amount, deployer, 0);
  console.log("Deposited succesfully!!!!");

  // Here we are getting the user account data
  let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // This will give the price of eth in DAI
  const DAIprice = await getDAIPrice();

  // Before we Borrow DAI we need to convert how much DAI is available for the given collateral
  // Here we wil be using the chainlink pricefeed to get the price of DAI
  // To get the amount to DAI i can borrow
  const amountDAItoBorrow =
    availableBorrowsETH.toString() * 0.95 * (1 / DAIprice.toNumber());
  // This gives the amount of dai to be borrowed in usd --> Eg: 29.3 DAI
  console.log(`The amount of DAI i can borrow ${amountDAItoBorrow} DAI`);

  const amountDAItoBorrowWei = ethers.utils.parseEther(
    amountDAItoBorrow.toString()
  );

  // Borrow!!
  // How much we have borrowed,how much we have in collateral,how much we can borrow
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

  await borrowDAI(daiTokenAddress, lendingPool, amountDAItoBorrowWei, deployer);

  // Getting the updated user data
  await getBorrowUserData(lendingPool, deployer);

  // Calling the repay function to repay the borrowed amount 
  await repay(amountDAItoBorrowWei, daiTokenAddress, lendingPool, deployer);

  // Getting the updated user data
  await getBorrowUserData(lendingPool, deployer);

  // Here we see that even after paying of te entire amount u will still have some small amount 
  // of debt, this is bcoz the borrowed DAI has accumalated the interest as borrower interest Rate
  // 
}

// This function is used to repay the borrowed amount;
async function repay(amount, daiAddress, lendingPool, account) {
  await approveERC(daiAddress, lendingPool.address, amount, account);

  const repaytx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repaytx.wait(1);

  console.log("Repaid the amount!!");
}

// This function is used to Borrow DAI
async function borrowDAI(daiAddress,lendingPool,amountDAItoBorrowWei,account) {
  const borrowDai = await lendingPool.borrow(daiAddress, amountDAItoBorrowWei, 1, 0, account);
  await borrowDai.wait(1);
  console.log("You have borrowed DAI ");
}

// This is used to get the aggregator v3 interface price feed and to get the price of ETH/DAI
async function getDAIPrice() {
  // Here if u observe we are not connecting it to the deployer since we aren't
  // sending any trx if we would be sending we would have connected a deployer
  const DAIEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );

    const price = (await DAIEthPriceFeed.latestRoundData())[1];
    
    console.log(`DAI to ETh price is ${price.toString()}`);

    return price;
}

// This is to get an account metrics on the lending Pool 
async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account);
    console.log(`The total colleteral amount in is ${totalCollateralETH}`);
    console.log(`The total debt u have taken ${totalDebtETH}`);
    console.log(`Money available to be borrowed ${availableBorrowsETH}`);
    return {totalDebtETH, availableBorrowsETH};
}

// This function is to get the address of the lendingPool and a variable set to interact with it
async function getLendingPool(account) {
    
    // This is to help us interact with the LendingPoolAddressesProvider since it gives the lending pool contract
    const lendingPoolAddressesProvider  = await ethers.getContractAt(
      "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
      account
    );

    // This function gives the address of the lendingpool 
    const LendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();

    // Since we have the address of the lending pool we can connect it to that contract, similarly 
    // like how we did it above

    // Here we are interacting with the Lending pool Contract 
    const lendingpool = await ethers.getContractAt("ILendingPool", LendingPoolAddress, account);
    
    return lendingpool;
}

// This function is to Approve the lending contract the access to use our ERC20 token Weth 
// On our behalf to deposit the token into the lending Pool 
async function approveERC(erc20Address,spenderAddress,amountToSpend,account) {
    // When connecting to the ERC20(Weth)contract address make sure u deposit some amount 
    // before u try to approve the function 

    const erc20Token = await ethers.getContractAt(
      "IERC20",
      erc20Address,
      account
    );
    
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);

    console.log("Approved!!!!")

}

main().then(() => process.exit(0)).catch((error) => {
    console.log(error)
    process.exit(1)
});