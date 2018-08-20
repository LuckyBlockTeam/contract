pragma solidity ^0.4.18;

import '../CappedLottery.sol';

contract TestnetCappedLottery is CappedLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        CappedLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCap() internal view returns (uint) {
        return 50 finney;
    }
}
