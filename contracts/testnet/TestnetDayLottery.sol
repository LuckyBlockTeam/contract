pragma solidity ^0.4.18;

import '../DayLottery.sol';

contract TestnetDayLottery is DayLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        DayLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (15 * 60));
    }

    /*************** INTERNAL *****************/
    function roundProcessTime() internal pure returns (uint256) {
        return 2*60*60;
    }

}
