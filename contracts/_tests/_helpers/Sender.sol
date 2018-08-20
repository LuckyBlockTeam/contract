pragma solidity ^0.4.18;

import '../../BaseLottery.sol';

/**
 * Contract emulates attacker who participate in lottery but doesn't allow to send him funds
 */
contract Sender {

    bool allowReceiveEther = false;

    function () external payable {
        require(allowReceiveEther);
    }

    function sendTo(address _to, uint _val) external payable {
        assert(_to.call.value(_val)());
    }

    function getPrize(address _lottery, uint _roundId) external {
        allowReceiveEther = true;
        BaseLottery(_lottery).getPrize(_roundId);
        allowReceiveEther = false;
    }

}
