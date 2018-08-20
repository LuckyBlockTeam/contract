pragma solidity ^0.4.18;

import './lifecycle/MultiownedPausable.sol';
import './RNG.sol';
import 'mixbytes-solidity/contracts/ownership/multiowned.sol';
import 'zeppelin-solidity/contracts/ReentrancyGuard.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract BaseLottery is multiowned, ReentrancyGuard, MultiownedPausable {
    using SafeMath for uint256;

    constructor(
        address[] _owners,
        address _profitAddress,
        address _rng
    )
        public
        multiowned(_owners, 2)
    {
        require(_profitAddress != address(0));
        require(_rng != address(0));

        m_profitAddress = _profitAddress;
        m_rng = RNG(_rng);

        assert(getWinnersSharesSum() == WINNERS_SHARE_DENOMINATOR);
    }

    /*************** STRUCTURES *****************/

    enum RoundState {NOT_STARTED, ACCEPT_FUNDS, WAIT_RESULT, SUCCESS, REFUND}

    struct TicketsInterval {
        address participant;
        uint256 ticketsBefore;
        uint256 ticketsCount;
    }

    struct LotteryRound {
        RoundState state;

        uint256 ticketsCount;
        uint256 totalFunds;
        uint256 currLotteryFunds;
        uint256 prize;
        uint256 refunded;

        uint256 randomRequestTime;

        uint256 nonce; //xored participants addresses

        TicketsInterval[] tickets;
        mapping(address => uint256) fundsByAddress;
        address[] participants;
        address[] winners;
        mapping(address => uint256) winnersUnsentPrizes;
    }

    /*************** FIELDS *****************/

    /** Constants */
    uint256 internal constant ORGANIZER_PERCENT = 20;
    uint256[10] internal BASE_WINNERS_SHARES = [500, 250, 125, 62, 32, 16, 8, 4, 2, 1];
    uint256 internal constant WINNERS_SHARE_DENOMINATOR = 1000;

    uint256 public constant DAY_LOTTERY_SHARE    = 10;
    uint256 public constant WEEK_LOTTERY_SHARE   = 5;
    uint256 public constant MONTH_LOTTERY_SHARE  = 5;
    uint256 public constant YEAR_LOTTERY_SHARE   = 5;
    uint256 public constant CAPPED_LOTTERY_SHARE = 5;
    uint256 public constant LOTTERY_SHARE_DENOMINATOR = 100;

    uint256 public constant BASE_TICKET_COST = 10 finney;

    /** Lottery founder address */
    address public m_profitAddress;

    /** RNG contract */
    RNG public m_rng;

    mapping(uint256 => LotteryRound) internal m_rounds;
    uint256[] public m_roundsIds;
    uint256 public m_currentRound;

    /*************** EVENTS *****************/

    event RoundStateChanged(uint256 roundId, RoundState roundState);
    event RNGBalanceAdded(uint roundId, uint sent);
    event WinningTicket(
        uint roundId, uint winnerNum, uint ticketNum, address winner, uint prize,
        uint roundPrize, uint roundTotalFunds
    );
    event OwnerCommission(
        uint roundId, uint calculatedCommission, uint sentCommission,
        uint roundPrize, uint roundTotalFunds
    );
    event Participation(
        uint roundId, address addr,
        uint participantTotalFunds, uint currLotteryRoundFunds,
        uint ticketsNumberStart, uint ticketsCount
    );

    event Refund(uint roundId, address addr, uint sum);
    event SendPrize(uint roundId, address addr, uint sum);

    /*************** MODIFIERS *****************/

    modifier requireState(uint256 _roundId, RoundState _state) {
        require(m_rounds[_roundId].state == _state);
        _;
    }

    /*************** PUBLIC *****************/

    /**
     * No direct payments to contract
     */
    // function () external payable {}

    function getCurrentRoundId() public returns (uint256);
    /**
     * Participate in lottery
     *
     * @param _participant Participant
     */
    function participateInternal(address _participant) internal nonReentrant whenNotPaused {
        require(msg.value>=getTicketCost());

        checkLastRoundsProcessed(5);
        checkRoundEnded();

        LotteryRound storage currRound = m_rounds[m_currentRound];
        assert(currRound.state == RoundState.ACCEPT_FUNDS);

        uint256 extraFunds   = msg.value % getTicketCost();
        uint256 ticketsCount = msg.value / getTicketCost(); //with knowledge about safemath
        uint256 roundTotalFunds = msg.value.sub(extraFunds);

        uint256 ownerCommission       = roundTotalFunds.mul(ORGANIZER_PERCENT).div(100);
        uint256 currLotteryRoundFunds = calcCurrLotteryRoundFunds(roundTotalFunds, _participant);


        currRound.tickets.push(
            TicketsInterval(_participant, currRound.ticketsCount, ticketsCount)
        );
        currRound.ticketsCount     = currRound.ticketsCount.add(ticketsCount);
        currRound.totalFunds       = currRound.totalFunds.add(roundTotalFunds);
        currRound.currLotteryFunds = currRound.currLotteryFunds.add(currLotteryRoundFunds);
        currRound.prize            = currRound.prize.add(currLotteryRoundFunds.sub(ownerCommission));
        if (currRound.fundsByAddress[_participant] == 0) {
            currRound.participants.push(_participant);
        }
        currRound.fundsByAddress[_participant] = currRound.fundsByAddress[_participant].add(currLotteryRoundFunds);
        currRound.nonce ^= uint(_participant);

        if (extraFunds > 0) {
            m_profitAddress.transfer(extraFunds);
        }

        emit Participation(
            m_currentRound, _participant,
            roundTotalFunds, currLotteryRoundFunds,
            currRound.ticketsCount.sub(ticketsCount), ticketsCount
        );
    }
    /**
     * Calculate round winners, send prize and owner commission
     */
    function processRound(uint256 _roundId, uint256[] _randomNumbers) public nonReentrant {
        require(msg.sender == address(m_rng));

        uint[] memory winnersShares = getWinnersShares();

        require(winnersShares.length == _randomNumbers.length);

        LotteryRound storage round = m_rounds[_roundId];
        assert(round.state == RoundState.WAIT_RESULT);
        assert(round.ticketsCount >= 1);

        address currentWinner;
        uint256 reservedForWinners;
        uint256 toSend;
        for (uint i; i< winnersShares.length; i++) {
            assert(_randomNumbers[i] < round.ticketsCount);

            currentWinner = findWinner(_roundId, _randomNumbers[i]);
            assert(currentWinner != address(0));

            toSend = calcWinnerPrize(_roundId, i, winnersShares);
            round.winners.push(currentWinner);

            emit WinningTicket(
                _roundId, i, _randomNumbers[i], currentWinner, toSend, round.prize, round.totalFunds
            );

            reservedForWinners = reservedForWinners.add(toSend);
            if (currentWinner.send(toSend)) {
                emit SendPrize(_roundId, currentWinner, toSend);
            } else {
                round.winnersUnsentPrizes[currentWinner] = round.winnersUnsentPrizes[currentWinner].add(toSend);
            }
        }

        uint roundOrganizerProfit = round.currLotteryFunds.sub(reservedForWinners);
        uint sentToRng = checkRNGBalance(_roundId, roundOrganizerProfit);
        uint roundOrganizerProfitToSend = roundOrganizerProfit.sub(sentToRng);
        m_profitAddress.transfer(roundOrganizerProfitToSend);

        emit OwnerCommission(
            _roundId, roundOrganizerProfit, roundOrganizerProfitToSend, round.prize, round.totalFunds
        );

        changeRoundState(_roundId, RoundState.SUCCESS);
    }

    /**
     * Check current round for end, start RNG calculation
     * Everyone can cal this function
     */
    function checkRoundEnded() public {
        uint256 realCurrRoundId = getCurrentRoundId();
        if (realCurrRoundId != m_currentRound) {

            changeRoundState(realCurrRoundId, RoundState.ACCEPT_FUNDS);
            m_roundsIds.push(realCurrRoundId);

            LotteryRound storage round = m_rounds[m_currentRound];
            if (round.ticketsCount < 1) {
                changeRoundState(m_currentRound, RoundState.REFUND);
            } else {
                changeRoundState(m_currentRound, RoundState.WAIT_RESULT);
                m_rng.getRandomNumber(
                    getRNGDelay(), m_currentRound, getWinnersShares().length, round.ticketsCount, round.nonce
                );
                round.randomRequestTime = getCurrentTime();
            }

            m_currentRound = realCurrRoundId;
        }
    }

    /**
     * Check that round was processed in time. If not - change state to REFUND
     * Everyone can cal this function
     */
    function checkRoundProcessed(uint _roundId) public requireState(_roundId, RoundState.WAIT_RESULT)  {
        if (m_rounds[_roundId].randomRequestTime + roundProcessTime() > getCurrentTime()) {
            return;
        }

        changeRoundState(_roundId, RoundState.REFUND);

        if (!m_paused) {
            pauseInternal();
        }
    }

    /**
     * Check that some last rounds was processed in time. If not - change state to REFUND
     * Everyone can cal this function
     */
    function checkLastRoundsProcessed(uint _count) public {
        uint fromRound;
        if (m_roundsIds.length > _count) {
            fromRound = m_roundsIds.length - _count;
        }
        for (uint i=fromRound; i<m_roundsIds.length; i++) {
            if (m_rounds[ m_roundsIds[i] ].state == RoundState.WAIT_RESULT) {
                checkRoundProcessed(m_roundsIds[i]);
            }
        }
    }


    /**
     * Refund funds to participants on round fail
     */
    function refund(uint256 _roundId)
        public
        nonReentrant
        requireState(_roundId, RoundState.REFUND)
    {
        LotteryRound storage round = m_rounds[_roundId];

        uint256 fundsToRefund = round.fundsByAddress[msg.sender];
        if (fundsToRefund == 0) {
            return;
        }

        round.refunded = round.refunded.add(fundsToRefund);
        round.fundsByAddress[msg.sender] = 0;

        msg.sender.transfer(fundsToRefund);
        emit Refund(_roundId, msg.sender, fundsToRefund);
    }

    /**
     * Refund funds to participants of last n rounds
     */
    function refundLastRounds(uint256 _count) public {
        uint fromRound;
        if (m_roundsIds.length > _count) {
            fromRound = m_roundsIds.length - _count;
        }
        for (uint i=fromRound; i<m_roundsIds.length; i++) {
            if (m_rounds[ m_roundsIds[i] ].state == RoundState.REFUND) {
                refund(m_roundsIds[i]);
            }
        }
    }

    /**
     * Send prize to winner
     */
    function getPrize(uint256 _roundId)
        public
        nonReentrant
        requireState(_roundId, RoundState.SUCCESS)
    {
        LotteryRound storage round = m_rounds[_roundId];

        uint256 fundsToSend = round.winnersUnsentPrizes[msg.sender];
        require(fundsToSend > 0);

        round.winnersUnsentPrizes[msg.sender] = 0;

        msg.sender.transfer(fundsToSend);
        emit SendPrize(_roundId, msg.sender, fundsToSend);
    }

    /**
     * Set address which owner commission will be sent to
     */
    function setProfitAddress(address _profitAddress) external onlymanyowners(keccak256(msg.data)) {
        m_profitAddress = _profitAddress;
    }

    /**
     * Owner can set refund state
     */
    function setRefundStateToRound(uint _roundId)
        external
        whenPaused
        requireState(_roundId, RoundState.ACCEPT_FUNDS)
        onlymanyowners(keccak256(msg.data))
    {
        changeRoundState(_roundId, RoundState.REFUND);
    }


    /**
     * Getter fo internal info
     */
    function getRoundInfo(uint256 _roundId)
        public
        view
        returns (RoundState, uint256, uint256, uint256, uint256, uint256, uint256)
    {
        return (
            m_rounds[_roundId].state,
            m_rounds[_roundId].ticketsCount,
            m_rounds[_roundId].totalFunds,
            m_rounds[_roundId].currLotteryFunds,
            m_rounds[_roundId].prize,
            m_rounds[_roundId].refunded,
            m_rounds[_roundId].randomRequestTime
        );
    }

    function getRoundParticipantFunds(uint256 _roundId, address _participant)
        public
        view
        returns (uint256)
    {
        return m_rounds[_roundId].fundsByAddress[_participant];
    }

    function getRoundParticipantsCount(uint256 _roundId)
        public
        view
        returns (uint)
    {
        return m_rounds[_roundId].participants.length;
    }

    function getRoundParticipants(uint256 _roundId, uint offset, uint limit)
        public
        view
        returns (address[] res)
    {
        require(offset < m_rounds[_roundId].participants.length);
        require(limit > 0);
        require(offset.add(limit) <= m_rounds[_roundId].participants.length);

        res = new address[](limit);
        for(uint i=offset; i<offset.add(limit); i++) {
            res[i.sub(offset)] = m_rounds[_roundId].participants[i];
        }
    }

    /**
     * Getter for internal info
     */
    function getRoundWinners(uint256 _roundId) public view returns (address[], uint[]) {
        if (m_rounds[_roundId].winners.length == 0) {
            return (new address[](0), new uint[](0));
        }

        uint[] memory prizes = new uint[](getWinnersShares().length);
        assert(m_rounds[_roundId].winners.length == prizes.length);

        for (uint i = 0; i < prizes.length; i++) {
            prizes[i] = calcWinnerPrize(_roundId, i, getWinnersShares());
        }

        return (m_rounds[_roundId].winners, prizes);
    }

    /**
     * Getter fo internal info
     */
    function getRoundWinnerUnsentPrize(uint256 _roundId, address _winner) public view returns (uint) {
        return m_rounds[_roundId].winnersUnsentPrizes[_winner];
    }

    /**
     * Getter fo internal info
     */
    function getRoundsCount() public view returns (uint) {
        return m_roundsIds.length;
    }

    function getRoundsIds(uint offset, uint limit) public view returns (uint[] res) {
        require(offset < m_roundsIds.length);
        require(limit > 0);
        require(offset.add(limit) <= m_roundsIds.length);

        res = new uint[](limit);
        for(uint i=offset; i<offset.add(limit); i++) {
            res[i.sub(offset)] = m_roundsIds[i];
        }
    }


    /*************** INTERNAL *****************/

    /**
     * Calc funds which will be distributed in round from all incoming funds to this round
     */
    function calcCurrLotteryRoundFunds(uint _roundTotalFunds, address _participant) internal returns (uint);

    function getTicketCost() view public returns (uint);

    function getWinnersShares() public view returns (uint[]) {
        uint[] memory winnersShares = new uint[](BASE_WINNERS_SHARES.length);
        for(uint i=0; i<BASE_WINNERS_SHARES.length; i++) {
            winnersShares[i] = BASE_WINNERS_SHARES[i];
        }
        return winnersShares;
    }

    function getWinnersSharesSum() internal view returns (uint) {
        uint[] memory winnersShares = getWinnersShares();

        uint winnersSharesSum;
        for(uint i=0; i<winnersShares.length; i++) {
            winnersSharesSum = winnersSharesSum.add(winnersShares[i]);
        }

        return winnersSharesSum;
    }

    /**
     * Change state of given round
     */
    function changeRoundState(uint256 _roundId, RoundState _newState) internal {
        if (_roundId==0) {
            return; //dummy round
        }

        LotteryRound storage round = m_rounds[_roundId];

        assert(round.state != _newState);

        if      (RoundState.NOT_STARTED  == round.state) { assert(RoundState.ACCEPT_FUNDS == _newState); }
        else if (RoundState.ACCEPT_FUNDS == round.state) { assert(RoundState.REFUND == _newState || RoundState.WAIT_RESULT == _newState); }
        else if (RoundState.WAIT_RESULT  == round.state) { assert(RoundState.REFUND == _newState || RoundState.SUCCESS == _newState); }
        else { assert(false); }

        round.state = _newState;
        emit RoundStateChanged(_roundId, round.state);
    }

    /** Get current time, replaced in tests */
    function getCurrentTime() internal view returns (uint256) {
        return now;
    }

    function calcWinnerPrize(uint _roundId, uint _winnerNum, uint[] _winnersShares) internal view returns (uint) {
        return m_rounds[_roundId].prize.mul(_winnersShares[_winnerNum]).div(WINNERS_SHARE_DENOMINATOR);
    }

    /**
     * Delay for calling back process round from RNG
     * see https://github.com/oraclize/ethereum-api/issues/22
     * see https://github.com/oraclize/ethereum-api/issues/39
     */
    function getRNGDelay() internal pure returns (uint256) {
        return 50;
    }

    /**
     * Time to calc round results
     */
    function roundProcessTime() internal pure returns (uint256) {
        return 24*60*60;
    }

    /**
     * Find winner in given round by ticket number
     * if random number > tickets count, 0 would be returned
     */
    function findWinner(uint _roundId, uint _randomNumber) internal returns (address) {
        if (_randomNumber >= m_rounds[_roundId].ticketsCount) {
            return address(0);
        }
        return findWinnerInternal(_roundId, 0, m_rounds[_roundId].tickets.length, _randomNumber);
    }

    /**
     * Internal fn for findWinner
     */
    function findWinnerInternal(
        uint _roundId, uint _begin, uint _end, uint _randomNumber
    ) internal returns (address) {
        uint len = _end - _begin;
        uint mid = _begin + len / 2;
        TicketsInterval storage interval = m_rounds[_roundId].tickets[mid];
        if (_randomNumber < interval.ticketsBefore) {
            return findWinnerInternal(_roundId, _begin, mid, _randomNumber);
        } else if (_randomNumber >= interval.ticketsBefore + interval.ticketsCount) {
            return findWinnerInternal(_roundId, mid + 1, _end, _randomNumber);
        } else {
            return interval.participant;
        }
    }

    /**
     * Check RNG balance and send to it ether if balance less than min
     *
     * @return sent to rng funds
     */
    function checkRNGBalance(uint _roundId, uint _max) internal returns (uint) {
        uint256 shortage = m_rng.getBalanceShortage();
        if (shortage == 0) {
            return 0;
        }

        uint256 toSend;
        if (shortage > _max) {
            toSend = _max;
        } else {
            toSend = shortage;
        }

        if (!address(m_rng).send(toSend)) {
            return 0;
        }

        emit RNGBalanceAdded(_roundId, toSend);
        return toSend;
    }
}
