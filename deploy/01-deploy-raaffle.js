const { network, ethers } = require("hardhat")
const {developmentChain, networkConfig} = require("../helper-hardhat.config")

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} =  deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Address

    if (developmentChain.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    }else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const args = [vrfCoordinatorV2Address, entranceFee, gasLane]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
        
    })
}