pragma solidity ^0.4.18;

import '../SecondLevelLottery.sol';
import './_helpers/TimeMock.sol';

contract SecondLevelLotteryHelper is SecondLevelLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        SecondLevelLottery(_owners, _profitAddress, _rng)
    {

    }

    function getCurrentRoundId() public returns (uint256) {
        return 1;
    }

    function getTicketCost() public view returns (uint) {
        return 1;
    }
}
