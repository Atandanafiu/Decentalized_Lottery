const {getNamedAccounts, deployments, ethers, network} = require("hardhat")
const {developmentChains, networkConfig} = require("../../helper-hardhat-config")
const {assert, expect} = require ("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
    let raffle, vrfCoordinatorV2Mock, deployer, raffleEntranceFee, interval
    const chainId = networkConfig.chainId

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        raffle = await ethers.getContractAt("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", deployer)
        raffleEntranceFee = await raffle.getEntrance()
        interval = await raffle.getInterval()
    })

    describe("construcor", async function () {
        it("intitiallizes the raffle correctly", async function () {
            const raffleState = await raffle.getRaffleState()
            const interval = await raffle.getInterval()
            assert.equal(raffleState.toString(), "0")
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
    })

    describe("Enter Raffle", function () {
        it("Should revert when you don't pay enough", async function  () {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle_notEnoughEther")
        })

        it("Should Record players when they enter", async function (){
            await raffle.enterRaffle({value: raffleEntranceFee})
            const playerFromContract = await raffle.getPlayer(0)
            assert.equal(playerFromContract, deployer) 
        })

        it("Should emit an event on enter", async function () {
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit( raffle, "RaffleEnter")
        })

        it("Should doesn't allow entrance when calculating", async function () {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            //check the chainlik upkeep
            await raffle.perFormUpkeep([])
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith("RaffleState_notOpen")
        })
    })

    describe("checkUpkeep",  function () {
        it("Should return false if peope haven't send any ETH", async function () {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            await(!upkeepNeeded)
        })

        it("Should false if raffle isn't open", async function () {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.perFormUpkeep([])
            const raffleState = await raffle.getRaffleState()
            const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(raffleState.toString(), "1")
            assert.equal(upkeepNeeded, false)
        })

        it("Should return true if enough time hasPassed, has players, eth and it open", async function (){
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({method: "evm_mine", params: []})
            const { upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert(upkeepNeeded)
        })

        it("Should return false if enough time  hasn't pass", async function (){
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({method: "evm_mine", params: []})
            const { upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })
    })

    describe("performUpkeep", function () {
        it("Should can only run if checkUpkeep is true", async function() {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const tx = await raffle.perFormUpkeep([])
            assert(tx)
        })

        it("should can only if checkUpkeep is false", async function(){
            await  expect(raffle.perFormUpkeep).to.be.revertedWith(" Raffle_UpkeepNotNeeded")
        })

        it("Should update the raffle state, emit and error", async function () {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_inceaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const txResponse = await raffle.perFormUpkeep([])
            const txReceipt = txResponse.events[1].args.requestId
            const raffleState  =  await raffle.getRaffleState()
            assert(requestId.toNumber() > 0)
            assert(raffleState.toNumber() == "1")
        })
    })

    describe("fulfillRandomWords", function () {
        beforeEach(async function () {
            await raffle.enterRaffle({value: raffleEntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
        })

        it("should can onlu be called after performUpkeep", async function () {
            await expect(vrfCoordinatorV2Mock.fulfullRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
            await expect(vrfCoordinatorV2Mock.fulfullRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
        })

        it("Should pick a winner, resets the lottery, and send money", async function () {
            const addtionalEntrance = 3
            const startingAccountIndex = 1
            const accoounts = await ethers.getSigners()
            for (let i = startingAccountIndex; i < startingAccountIndexrray + addtionalEntrance; i++) {
                const accountConnectedRaffle = raffle.connect(accoounts[1])
                await accountConnectedRaffle.enterRaffle({value: raffleEntranceFee})
            }
            const startingTimeStamp = await raffle.getLastTimeStamp()
            /**
             * performUppkeep (mocks being chainlink keepers)
             * fulfillRandomWord(moock being chainlink vrf)
             * we'll have to wait for fulfillRandomWords to be called
             */

            await new Promise(async (resolve, reject) => {
                raffle.once("WinnerPicked", async () => {
                    console,log("Found the event")
                    try {
                        const recentWinner = await raffle.getRecentWinner()
                        console.log(recentWinner)
                        console.log(accoounts[2].address)
                        console.log(accoounts[0].address)
                        console.log(accoounts[1].address)
                        console.log(accoounts[3].address)
                        const raffleState =  await raffle.getRaffleState()
                        const endingTimeSamp = await raffle.getLatestTimeStamp()
                        const numPlayer = await raffle.getNumberOfPlayer()
                        const winnerEndingBalance = await accoounts[1].getBalance()
                        assert.equal(numPlayer.toString(), "0")
                        assert.equal(raffleState.toString(), "0")
                        assert(endingTimeSamp > startingTimeStamp)

                        assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(
                            raffleEntranceFee.mul(addtionalEntrance).add(raffleEntranceFee).toString()
                        ))
                    } catch (error) {
                        reject(error)
                    }
                    resolve()
                })
                /**
                 * setUp the listener
                 * below we'll fire event, and the listener will pick up, and resolve
                 */

                const tx = await raffle.perFormUpkeep([])
                const txReceipt = await tx.wait(1)
                const winnerStartingBalance = await accoounts[1].getBalance()
                await vrfCoordinatorV2Mock.fulfullRandomWords(txReceipt.events[1].args.requestId, raffle.address)
            })
        })
    })
})