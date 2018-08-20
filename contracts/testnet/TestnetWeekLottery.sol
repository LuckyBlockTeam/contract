pragma solidity ^0.4.18;

import '../WeekLottery.sol';

contract TestnetWeekLottery is WeekLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        WeekLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (30 * 60));
    }

}
