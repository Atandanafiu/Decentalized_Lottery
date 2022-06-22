const {getNamedAccounts, deployments, ethers, network} = require("hardhat")
const {developmentChains, networkConfig} = require("../../helper-hardhat-config")
const {assert, expect} = require ("chai")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { inputToConfig } = require("@ethereum-waffle/compiler")

developmentChains.includes(network.name)
    ? describe.skip
    :   describe("Raffle Unit Tests", function () {
            let raffle, deployer, raffleEntranceFee
            const chainId = networkConfig.chainId

            beforeEach(async () => {
                deployer = (await getNamedAccounts()).deployer
                raffle = await ethers.getContractAt("Raffle", deployer)
                raffleEntranceFee = await raffle.getEntrance()
        })

        describe("fulfillRandomWords", function () {
            it("Works with live chainlink keepers and chainlink VRF, we got a random winner", async function () {
                const startingTimeStamp = await raffle.getLastestTimeStamp()
                const accounts = await ethers.getSigners()

                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () =>  {
                        console.log("WinnerPicked event fire")
                        try {
                            // adding assert 
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerEndingBalance = await accounts[0].getBalance()
                            const endingTimeSamp = await raffle.getLastestTimeStamp()

                            await expect(raffle.getPlayer(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[0].address)
                            assert.equal(raffleState, 0)
                            assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee).toString())
                            assert.equal(endingTimeSamp > startingTimeStamp)
                            
                        } catch (error) {
                            console.log(error)
                            reject(error)
                        }
                        resolve()
                    })
                })
            })
        })
})