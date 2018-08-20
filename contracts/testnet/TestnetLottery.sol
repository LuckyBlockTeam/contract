pragma solidity ^0.4.18;

import '../Lottery.sol';

contract TestnetLottery is Lottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng,

        address _dayLottery,
        address _weekLottery,
        address _monthLottery,
        address _yearLottery,
        address _cappedLottery
    )
        public
        Lottery(_owners, _profitAddress, _rng, _dayLottery, _weekLottery, _monthLottery, _yearLottery, _cappedLottery)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (5 * 60));
    }
}
