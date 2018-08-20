pragma solidity ^0.4.18;

import '../DayLottery.sol';
import './_helpers/TimeMock.sol';

contract DayLotteryHelper is DayLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        DayLottery(_owners, _profitAddress, _rng)
    {

    }

    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }

}
