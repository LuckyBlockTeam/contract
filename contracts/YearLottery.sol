pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';
import './vendor/DateTime.sol';

contract YearLottery is SecondLevelLottery, DateTime {

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

        return toTimestamp(getYear(currTime), 1);
    }

    function getTicketCost() public view returns (uint) {
        return BASE_TICKET_COST * YEAR_LOTTERY_SHARE / LOTTERY_SHARE_DENOMINATOR;
    }
}
