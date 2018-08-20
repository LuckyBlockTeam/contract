pragma solidity ^0.4.18;

import '../BaseLottery.sol';
import './_helpers/TimeMock.sol';

contract BaseLotteryHelper is BaseLottery, TimeMock {

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        BaseLottery(_owners, _profitAddress, _rng)
    {

    }

    function processRound(uint256, uint256[]) public {}

    function getCurrentRoundId() public returns (uint256) {}

    function calcCurrLotteryRoundFunds(uint /*_roundTotalFunds*/, address /*_participant*/) internal returns (uint) {}

    function getTicketCost() public view returns (uint) {}


    function findWinnerPublic(uint _roundId, uint _randomNumber) public returns (address) {
        return findWinner(_roundId, _randomNumber);
    }
    function pushToRoundTickets(
        uint _roundId, address _participant, uint256 _ticketsBefore, uint256 _ticketsCount
    ) public {
        m_rounds[_roundId].tickets.push(
            TicketsInterval(_participant, _ticketsBefore, _ticketsCount)
        );
        m_rounds[_roundId].ticketsCount += _ticketsCount;
    }

}
