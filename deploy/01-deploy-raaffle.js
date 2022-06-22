const { network, ethers } = require("hardhat")
const {developmentChain, networkConfig} = require("../helper-hardhat.config")
const {verify} = require("../helper-hardhat.config")

const VRF_FUND_SUB_ID = ethers.utils.parseEther(0.003)

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} =  deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Address, subcriptionId

    if (developmentChain.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubcription()
        const transactionReceipt = await transactionResponse.wait(1)
        subcriptionId = transactionReceipt.event[0].args.subId
        await vrfCoordinatorV2Mock.fundSubcription(subcriptionId, VRF_FUND_SUB_ID)
    }else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subcriptionId = networkConfig[chainId]["subcriptionId"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval= networkConfig[chainId]["intervaal"]
    const args = [vrfCoordinatorV2Address, entranceFee, gasLane, subcriptionId, callbackGasLimit, interval]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
        
    })

    if (!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying .......")
        await verify(raffle.address, args)

    }
    log("____________________________________________________________________________________________________")
}

module.exports.tags =["all", "raffle"]