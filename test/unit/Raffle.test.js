const {getNamedAccounts, deployments, ethers, network} = require("hardhat")
const {developmentChain, networkConfig} = require("../../helper-hardhat-config")
const {assert} = require ("chai")

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
    let raffle, vrfCoordinatorV2Mock
    const chainId = networkConfig.chainId

    beforeEach(async function () {
        const {deployer} = await getNamedAccounts()
        await deployments.fixture(["all"])
        raffle = await ethers.getContractAt("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", deployer)
    })

    describe("construcor", async function () {
        it("Should initializes the raffle correctly", async function () {
            const raffleState = await raffle.getRaffleState()
            const interval = await raffle.getInterval()
            assert.equal(raffleState.toString(), "0")
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
    })
})