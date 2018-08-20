pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';
import './BaseLottery.sol';

contract DayLottery is SecondLevelLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        SecondLevelLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (24 * 60 * 60));
    }

    function getTicketCost() view public returns (uint) {
        return BASE_TICKET_COST * DAY_LOTTERY_SHARE / LOTTERY_SHARE_DENOMINATOR;
    }

}
