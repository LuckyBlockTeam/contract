pragma solidity ^0.4.18;


import "../../lifecycle/MultiownedPausable.sol";


// mock class using Pausable
contract MultiownedPausableHelper is MultiownedPausable {

    constructor(address[] _owners) public multiowned(_owners, 2) {

    }

    bool public drasticMeasureTaken;
    uint256 public count;

    function PausableMock() public {
        drasticMeasureTaken = false;
        count = 0;
    }

    function normalProcess() external whenNotPaused {
        count++;
    }

    function drasticMeasure() external whenPaused {
        drasticMeasureTaken = true;
    }

}