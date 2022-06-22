//SPDX-License-Identifier:MIT
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

pragma solidity ^0.8.0;
error Raffle_notEnoughEther();
error Raffle_TransferFailed();
error RaffleState_notOpen();
error Raffle_UpkeepNotNeeded(uint currentBalnace, uint numPlayers, uint raffeState);


/**
* @title Decentralized__Lottery
* @author Atanda Nafiu
* @dev This smart contract uses Chainlink VRF and Chainlink Keepers
* @notice A decentralized smart contract
 */
contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /**Type Declaration */
    enum RaffleState {OPEN, CALCULATING}

    //State Variable
    uint private immutable i_minimumUSD;
    address payable[] private  s_players;
    bytes32 private immutable i_gasLane;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subcriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint32 private constant NUMWORDS = 1;

    /**Lottery state variable */
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint private immutable i_interval;
    uint private s_lastTimeStamp;

    /**Event */
    event RaffleEnter(address indexed player);
    event RaffleRequestRandomWinner(uint indexed requestId);
    event PicckedWinner(address indexed recentWinner);

    constructor (address vrfCoordinatorV2, uint entranceFee, bytes32 gasLane,uint64 subcriptionId, uint32 callbackGasLimit, uint interval) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_minimumUSD = entranceFee;
        i_gasLane = gasLane;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subcriptionId = subcriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
    }

    function enterRaffle() public payable {
        if (msg.value < i_minimumUSD) {
            revert Raffle_notEnoughEther();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert RaffleState_notOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function performUpkeep(bytes calldata /**performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        // require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Raffle_UpkeepNotNeeded(

                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING; 
        uint requestId = i_vrfCoordinator.requestRandomWords(
        i_gasLane,
        i_subcriptionId,
        REQUEST_CONFIRMATION,
        i_callbackGasLimit,
        NUMWORDS
        );  
        emit RaffleRequestRandomWinner(requestId);
    }
    function fulfillRandomWords(uint /**requestId*/, uint[] memory randomWord) internal override{
        uint indexOfWinner = randomWord[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address  payable[](0);
        s_lastTimeStamp = block.timestamp;
       (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle_TransferFailed();
        }
        emit PicckedWinner(recentWinner);
    }

    /**
    * @dev This is the function that the chainlink keeprs node call 
    * they look for the upkeepNeed to return true 
    * The following should be true in order to return true:
    * 1> The time intervaal should have passed
    * 2> The lottery should hae at lest one player, and have some eth
    * 3> The subcription should be funded with LINK
    * 4> The lottery should be in an open state 
     */
    
    function checkUpkeep(bytes memory /**checkData */) 
        public override returns 
    (
        bool upkeepNeeded, bytes memory /**performData */
    ){
        bool isOpen = RaffleState.OPEN == s_raffleState;
         bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers= s_players.length > 0;
        bool hasBalanc = address(this).balance > 0;
        upkeepNeeded = timePassed && isOpen && hasBalanc && hasPlayers;
    }

    /**view/ pure function */
    function getEntrance() public view returns(uint){
        return i_minimumUSD;
    }

    function getPlayer(uint index) public view returns(address){
        return s_players[index];
    }

    function getRecentWiner() public view returns(address){
        return s_recentWinner;
    }

    function getRaffleState() public view returns(RaffleState){
        return s_raffleState;
    }

    function getNumWords() public pure returns(uint) {
        return NUMWORDS;
    }

    function getNumberOfPlayers() public view returns(uint) {
        return s_players.length;
    }

    function getTimeStamp () public view returns(uint){
        return s_lastTimeStamp;
    }

    function getRequestConfirmation() public pure returns(uint){
        return REQUEST_CONFIRMATION;
    }

    function getInterval() public view returns(uint) {
        return i_interval;
    }

}
