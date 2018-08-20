pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';

contract WeekLottery is SecondLevelLottery {

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
        uint256 mod = currTime % (7*24*60*60);

        if (mod >= 4*24*60*60 ) {
            return currTime - mod + 4*24*60*60;
        }

        return currTime - mod - 3*24*60*60;
    }

    function getTicketCost() public view returns (uint) {
        return BASE_TICKET_COST * WEEK_LOTTERY_SHARE / LOTTERY_SHARE_DENOMINATOR;
    }
}
