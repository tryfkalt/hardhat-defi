const { getNamedAccounts, ethers } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.02");

async function getWeth() {
  const { deployer } = await getNamedAccounts();
  // call the "deposit" function of the WETH contract
  // get the WETH contract with abi from IWeth at this address connected to the deployer
  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",//mainnet address
    deployer,
  );
  const tx = await iWeth.deposit({ value: AMOUNT });
  await tx.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer);
  console.log("WETH balance:", wethBalance.toString());
}

module.exports = { getWeth };
