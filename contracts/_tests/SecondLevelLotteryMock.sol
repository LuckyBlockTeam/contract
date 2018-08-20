pragma solidity ^0.4.18;

import '../SecondLevelLottery.sol';

/**
 * Mock for base lottery testing
 */
contract SecondLevelLotteryMock is SecondLevelLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        SecondLevelLottery(_owners, _profitAddress, _rng)
    {

    }

    // save parameters to check in tests
    address public m_lastParticipant;
    function participate(address _participant) public payable {
        m_lastParticipant = _participant;
    }

    // save results from rng to check in tests
    uint256 public processRound_roundId;
    uint256[] public processRound_randomNumbers;
    function processRound(uint256 _roundId, uint256[] _randomNumbers) public {
        processRound_roundId = _roundId;

        processRound_randomNumbers.length=0;
        for(uint i; i<_randomNumbers.length; i++) {
            processRound_randomNumbers.push(_randomNumbers[i]);
        }
    }

    function refund(uint256) public {}

    function getCurrentRoundId() public returns (uint256) {
        return 1;
    }

    // call rng for tests
    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }

    function getTicketCost() public view returns (uint) {
        return 1;
    }

}
