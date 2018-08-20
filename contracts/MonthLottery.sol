pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';
import './vendor/DateTime.sol';

contract MonthLottery is SecondLevelLottery, DateTime {

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

        _DateTime memory dt = parseTimestamp(currTime);
        return toTimestamp(dt.year, dt.month);
    }

    function getTicketCost() public view returns (uint) {
        return BASE_TICKET_COST * MONTH_LOTTERY_SHARE / LOTTERY_SHARE_DENOMINATOR;
    }
}
