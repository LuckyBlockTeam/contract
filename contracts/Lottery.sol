pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';

contract Lottery is BaseLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng,

        address _dayLottery,
        address _weekLottery,
        address _monthLottery,
        address _yearLottery,
        address _cappedLottery
    )
        public
        BaseLottery(_owners, _profitAddress, _rng)
    {
        require(_dayLottery    != address(0));
        require(_weekLottery   != address(0));
        require(_monthLottery  != address(0));
        require(_yearLottery   != address(0));
        require(_cappedLottery != address(0));

        m_dayLottery    = SecondLevelLottery(_dayLottery);
        m_weekLottery   = SecondLevelLottery(_weekLottery);
        m_monthLottery  = SecondLevelLottery(_monthLottery);
        m_yearLottery   = SecondLevelLottery(_yearLottery);
        m_cappedLottery = SecondLevelLottery(_cappedLottery);

    }

    /*************** STRUCTURES *****************/


    /*************** FIELDS *****************/


    /** Other lotteries */
    SecondLevelLottery public m_dayLottery;
    SecondLevelLottery public m_weekLottery;
    SecondLevelLottery public m_monthLottery;
    SecondLevelLottery public m_yearLottery;
    SecondLevelLottery public m_cappedLottery;

    /*************** EVENTS *****************/

    /*************** MODIFIERS *****************/

    /*************** PUBLIC *****************/

    /**
     * Handler for incoming payments to contract
     */
    function () external payable whenNotPaused {
        require(0 == msg.data.length);

        participateInternal(msg.sender);
    }

    function getCurrentRoundId() public returns (uint256) {
        uint256 currTime = getCurrentTime();
        return currTime - (currTime %  (60 * 60));
    }


    function getTicketCost() public view returns (uint) {
        return BASE_TICKET_COST;
    }

    /*************** INTERNAL *****************/

    /**
     * Calc funds which will be distributed in round from all incoming funds to this round
     */
    function calcCurrLotteryRoundFunds(uint _roundTotalFunds, address _participant)
        internal
        returns (uint)
    {
        uint256 dayContribution  = _roundTotalFunds.mul(DAY_LOTTERY_SHARE).div(LOTTERY_SHARE_DENOMINATOR);
        uint256 weekContribution  = _roundTotalFunds.mul(WEEK_LOTTERY_SHARE).div(LOTTERY_SHARE_DENOMINATOR);
        uint256 monthContribution = _roundTotalFunds.mul(MONTH_LOTTERY_SHARE).div(LOTTERY_SHARE_DENOMINATOR);
        uint256 yearContribution  = _roundTotalFunds.mul(YEAR_LOTTERY_SHARE).div(LOTTERY_SHARE_DENOMINATOR);
        uint256 cappedContribution = _roundTotalFunds.mul(CAPPED_LOTTERY_SHARE).div(LOTTERY_SHARE_DENOMINATOR);

        // best practices are moving transfer to the end of fn, but this transfers to our contracts
        m_dayLottery.participate.value(dayContribution)(_participant);
        m_weekLottery.participate.value(weekContribution)(_participant);
        m_monthLottery.participate.value(monthContribution)(_participant);
        m_yearLottery.participate.value(yearContribution)(_participant);
        m_cappedLottery.participate.value(cappedContribution)(_participant);

        uint secondLayerContributions = dayContribution
            .add(weekContribution)
            .add(monthContribution)
            .add(yearContribution)
            .add(cappedContribution);

        return _roundTotalFunds.sub(secondLayerContributions);
    }

}
