pragma solidity ^0.4.18;

import '../MonthLottery.sol';

contract TestnetMonthLottery is MonthLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        MonthLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (45 * 60));
    }

}
