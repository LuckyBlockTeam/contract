pragma solidity ^0.4.18;

import '../CappedLottery.sol';
import './_helpers/TimeMock.sol';

contract CappedLotteryHelper is CappedLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        CappedLottery(_owners, _profitAddress, _rng)
    {

    }

    uint256 public CAP_tests = 100 finney;

    function __callGetRandom(uint _round_id, uint _maxValue) public {
        m_rng.getRandomNumber(0, _round_id, getWinnersShares().length, _maxValue, 0);
    }

    function setCap(uint _cap) public {
        CAP_tests = _cap;
    }
    function getCap() internal view returns (uint) {
        return CAP_tests;
    }

}
