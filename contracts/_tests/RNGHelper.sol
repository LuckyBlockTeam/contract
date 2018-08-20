pragma solidity ^0.4.18;

import '../RNG.sol';

contract RNGHelper is RNG {

    constructor(address[] _owners)
        public
        RNG(_owners)
    {
        //https://ethereum.stackexchange.com/questions/11383/oracle-oraclize-it-with-truffle-and-testrpc
        //https://github.com/oraclize/ethereum-bridge
        //OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    /*************** ORACLIZE MOCKS *****************/

    function oraclize_setProof(byte proofP) internal {proofP;}
    function custom_oraclize_newRandomDSQuery(uint _delay, uint _nbytes, uint _customGasLimit, uint _additionalNonce) internal returns (bytes32) {
        _delay;_nbytes;_customGasLimit;_additionalNonce;
        return bytes32(1);
    }
    function oraclize_cbAddress() internal returns (address){
        return 0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE; // 9th account from truffle testrpc
    }
    function oraclize_randomDS_proofVerify__returnCode(bytes32 _queryId, string _result, bytes _proof) internal returns (uint8){
        _queryId;_result;_proof;
        return 0;
    }


    /**
     * Call callback function instead of oraclize
     */
    function __callCallback() public {
        bytes memory b = new bytes(1);
        __callback(bytes32(1), "123", b);
    }

    function _getRandomNumber(string _randomStr, uint256 _num, uint256 _maxValue)
        internal
        pure
        returns (uint256)
    {
        _randomStr;
        return _num % _maxValue;
    }

}
