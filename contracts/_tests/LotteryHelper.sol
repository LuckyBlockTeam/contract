pragma solidity ^0.4.18;

import '../Lottery.sol';
import './_helpers/TimeMock.sol';

contract LotteryHelper is Lottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng,
        address lot1,
        address lot2,
        address lot3,
        address lot4,
        address lot5
    )
        public
        Lottery(_owners, _profitAddress, _rng, lot1, lot2, lot3, lot4, lot5)
    {

    }

    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }
}
