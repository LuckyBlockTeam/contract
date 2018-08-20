pragma solidity ^0.4.18;

import '../YearLottery.sol';
import './_helpers/TimeMock.sol';

contract YearLotteryHelper is YearLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        YearLottery(_owners, _profitAddress, _rng)
    {

    }

    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }

}
