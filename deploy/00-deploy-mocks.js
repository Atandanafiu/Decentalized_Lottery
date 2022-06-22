const {developmentChains} = require("../helper-hardhat-config")

const decimals = 18
const input = "0.25" // Note: this is a string, e.g. user input  //0.25 ia the premium. it cost 0.25 LINK
const BASE_FEE = ethers.utils.parseUnits(input, decimals)
const GAS_PRICE_LINK =  1e12  // Calculated value based on the gas price gas chain

module.exports = async function ({getNamedAccounts, deployments}){
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts
    const args = [BASE_FEE, GAS_PRICE_LINK]
    if (developmentChains.includes(network.name)) {
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