pragma solidity ^0.4.18;

import './SecondLevelLottery.sol';

contract CappedLottery is SecondLevelLottery {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        SecondLevelLottery(_owners, _profitAddress, _rng)
    {

    }

    /*************** FIELDS *****************/

    /** Constants */
    uint256 public constant CAP = 1000000 ether;

    uint256[1] internal CAPPED_WINNERS_SHARES = [1000];

    uint256 public m_unstartedRound = 0;

    /*************** PUBLIC *****************/

    function getCurrentRoundId() public returns (uint256) {
        if (m_currentRound!=0 && m_rounds[m_currentRound].totalFunds < getCap()) {
            return m_currentRound;
        }

        if (m_unstartedRound <= m_currentRound) {
            m_unstartedRound = getCurrentTime();
        }

        return m_unstartedRound;
    }

    function getTicketCost() public view returns (uint) {
        return BASE_TICKET_COST * CAPPED_LOTTERY_SHARE / LOTTERY_SHARE_DENOMINATOR;
    }

    /*************** INTERNAL *****************/
    function getCap() internal view returns (uint) {
        return CAP;
    }

    function getWinnersShares() public view returns (uint[]) {
        uint[] memory winnersShares = new uint[](CAPPED_WINNERS_SHARES.length);
        for(uint i=0; i<CAPPED_WINNERS_SHARES.length; i++) {
            winnersShares[i] = CAPPED_WINNERS_SHARES[i];
        }
        return winnersShares;
    }

}
