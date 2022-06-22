const { ethers } = require("ethers")
const { network } = require("hardhat")
const {developmentChain} = require(("../helper-hardhat.config.js"))

const BASE_FEE = ethers.utils.parseEther("0.25") //0.25 ia the premium. it cost 0.25 LINK
const GAS_PRICE_LINK =  1e12  // Calculated value based on the gas price gas chain

module.exports = async function ({getNamedAccounts, development}){
    const {deploy, log} = development
    const {deployer} = await getNamedAccounts
    const args = [BASE_FEE, GAS_PRICE_LINK]
    if (developmentChain.includes(network.name)) {
        log("Local network detected, Deploying mocks ...")
        // deploy mocks vrfCoordinator...................
        await deploy("VRFCoordinatorV2Mock",{
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deploy ....... ")
        log("________________________________________________________________________________")
    }
}

module.exports.tags = ["all", "mocks"]