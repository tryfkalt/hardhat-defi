const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth } = require("../scripts/getWeth");

async function main() {
  // The protocol treats every asset as an ERC20 token
  // WETH is basically ETH wrapped as an ERC20 token
  await getWeth();
  // now we deposit the WETH into the Aave protocol
  const { deployer } = await getNamedAccounts();
  // get the LendingPool address
  // Lending Pool: ^ (from LendingPoolAddressesProvider)
  const lendingPool = await getLendingPool(deployer);
  console.log("LendingPool address:", lendingPool.address);
  /* the LendingPool contract has a "deposit" function that contains safeTransferFrom functionality.
   So the contract will transfer the WETH from the msg.sender to the LendingPool contract.
   To to that we need to approve the LendingPool contract to transfer the WETH from the msg.sender.
   We can do that with the "approve" function of the WETH contract.
   wethTokenAddress is the address of the WETH token. */
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // approve lendingPool to pull WETH from our account
  await approveErc20(
    wethTokenAddress,
    lendingPool.address,
    ethers.utils.parseEther("0.02"),
    deployer
  );
  console.log("Depositing...");
  await lendingPool.deposit(wethTokenAddress, ethers.utils.parseEther("0.02"), deployer, 0);
  console.log("Deposited!");

  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer);

  // What the conversion rate on DAI to ETH?
  const daiPrice = await getDAIPrice();
  const amountDAIToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber());
  const amountDAIToBorrowWei = ethers.utils.parseEther(amountDAIToBorrow.toString());
  // availableBorrowsETH is the amount of ETH that we can borrow
  console.log(`You can borrow ${amountDAIToBorrow.toString()} DAI`);
  // Borrow
  // how much we have borrowed. how much we have in collateral, how much we can borrow
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDAI(daiTokenAddress, lendingPool, amountDAIToBorrowWei, deployer);
  await getBorrowUserData(lendingPool, deployer);
  // The reason why our collateral is higher than our debt is because we are borrowing 95% of our available collateral
  // The reason why our collateral is higher after borrowing is because we are gaining interest on our collateral
  // When we deposit we get back an aToken / interest pairing token which gets burnt when we withdraw

  // We can also repay the loan
  await repay(amountDAIToBorrowWei, daiTokenAddress, lendingPool, deployer);
  await getBorrowUserData(lendingPool, deployer);
  // after repaying due to the fact that we got interest by borrowing, we still owe some more ETH

}

// to repay, just like deposit we have to approve sending back to aave
async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 2, account);
  await repayTx.wait(1);
  console.log("Repaid!");
}

async function getLendingPool(account) {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);
  return lendingPool;
}

// spenderAddress is the contract we are going to approve to spend the tokens
async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account);
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved", spenderAddress);
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);
  console.log("Total collateral ETH:", totalCollateralETH.toString());
  console.log("Total debt ETH:", totalDebtETH.toString());
  console.log("Available borrows ETH:", availableBorrowsETH.toString());
  return { availableBorrowsETH, totalDebtETH };
}

async function borrowDAI(daiAddress, lendingPool, amountDAIToBorrowWei, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amountDAIToBorrowWei, 2, 0, account);
  await borrowTx.wait(1);
  console.log("Borrowed DAI!");
}

async function getDAIPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  ); // we don't need to connect to the deployer as we are not going to send any transactions, only reading
  const price = (await daiEthPriceFeed.latestRoundData())[1]; // only returns the answer (price)
  console.log("DAI price in ETH:", price.toString());
  return price;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
