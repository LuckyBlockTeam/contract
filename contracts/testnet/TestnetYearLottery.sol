pragma solidity ^0.4.18;

import '../YearLottery.sol';

contract TestnetYearLottery is YearLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        YearLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (60 * 60));
    }

}
