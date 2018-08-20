pragma solidity ^0.4.18;

import './BaseLottery.sol';

contract SecondLevelLottery is BaseLottery {
    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        BaseLottery(_owners, _profitAddress, _rng)
    {

        assert(
            100
            ==
            ORGANIZER_PERCENT
            +(100-ORGANIZER_PERCENT)* getWinnersSharesSum()/WINNERS_SHARE_DENOMINATOR
        );
    }

    /*************** STRUCTURES *****************/


    /*************** FIELDS *****************/

    /** Constants */

    /** Main lottery */
    address public m_mainLottery;

    /*************** EVENTS *****************/

    /*************** MODIFIERS *****************/

    modifier onlyMainLottery() {
        require(msg.sender==m_mainLottery);
        _;
    }

    /*************** PUBLIC *****************/

    /**
     * No direct payments to contract
     */
    function() external {
        revert();
    }


    function getCurrentRoundId() public returns (uint256);

    /**
     * Participate in lottery
     *
     * @param _participant Participant
     */
    function participate(address _participant) public payable onlyMainLottery {
        participateInternal(_participant);
    }


    /**
     * Set main lottery
     */
    function setMainLottery(address _mainLottery) external onlymanyowners(keccak256(msg.data)) {
        require(address(0) != _mainLottery);
        require(address(0) == m_mainLottery);

        m_mainLottery = _mainLottery;
    }


    /*************** INTERNAL *****************/

    /**
     * Calc funds which will be distributed in round from all incoming funds to this round
     */
    function calcCurrLotteryRoundFunds(uint _roundTotalFunds, address /*_participant*/)
        internal
        returns (uint)
    {
        return _roundTotalFunds;
    }

}
