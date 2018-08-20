pragma solidity ^0.4.18;

import '../MonthLottery.sol';
import './_helpers/TimeMock.sol';

contract MonthLotteryHelper is MonthLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        MonthLottery(_owners, _profitAddress, _rng)
    {

    }

    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }

}
