pragma solidity ^0.4.18;

import "./vendor/oraclize.sol";
import "./BaseLottery.sol";
import 'mixbytes-solidity/contracts/ownership/multiowned.sol';

contract RNG is multiowned, usingOraclize {

    constructor(address[] _owners)
        public
        multiowned(_owners, 2)
    {
        oraclize_setProof(proofType_Ledger);
    }

    /*************** STRUCTURES *****************/

    struct QueryDetails {
        uint256 roundId;
        address lottery;
        uint256 numbersCount;
        uint256 maxValue;
    }

    /*************** EVENTS *****************/

    event newRandomNumber_bytes(bytes);
    event newRandomNumber_uint(uint256[]);
    event checkFailed(uint8 result);

    /*************** FIELDS *****************/

    /** Lotteries addresses for access check */
    mapping(address=>bool) m_lotteries;
    address[] public m_lotteriesList;

    /** Min balance of rng. If is less, will be added by lottery contracts*/
    uint256 public m_minBalance = 1 ether;

    /** Gas price for oraclize callback. Will be charged from this contract. Default is 20 Gwei */
    uint256 public m_callbackGasPrice = 20 * 10**9;
    /** Gas limit which will be set when oraclize would call rng.__callback */
    uint256 public m_callbackGas = 1500000;

    mapping(bytes32 => QueryDetails) m_queryDetails;

    /*************** PUBLIC *****************/

    function () external payable {
        //nothing here
    }

    /**
     * Withdraw funds
     */
    function withdraw(address _to, uint256 _value) external onlymanyowners(keccak256(msg.data)) {
        _to.transfer(_value);
    }

    /**
     * Set lotteries
     */
    function setLotteries(address[] _lotteries) external onlymanyowners(keccak256(msg.data)) {
        require(6==_lotteries.length);
        require(0==m_lotteriesList.length);

        for (uint i = 0; i < _lotteries.length; ++i) {
            address lottery = _lotteries[i];
            require(lottery!=address(0));
            require(!m_lotteries[lottery]);


            m_lotteries[lottery] = true;
            m_lotteriesList.push(lottery);
        }

    }

    /**
     * Set min balance
     */
    function setMinBalance(uint256 _newMinBalance) external onlymanyowners(keccak256(msg.data)) {
        require(_newMinBalance > 0);

        m_minBalance = _newMinBalance;
    }

    /**
     * Set Gas price for oraclize callback
     */
    function setCallbackGasPrice(uint _gasPrice) external onlymanyowners(keccak256(msg.data)) {
        require(_gasPrice > 0);

        m_callbackGasPrice = _gasPrice;
        oraclize_setCustomGasPrice(_gasPrice);
    }

    /**
     * Set Gas limit for oraclize callback
     */
    function setCallbackGas(uint _gas) external onlymanyowners(keccak256(msg.data)) {
        require(_gas > 0);

        m_callbackGas = _gas;
    }

    /**
     * Push task for getting random number
     *
     * @param _delay number of seconds to wait before the execution takes place
     * @param _roundId Id of round
     * @param _numbersCount Count of needed random numbers
     * @param _maxValue Max value of random number
     * @param _nonce Custom nonce
     */
    function getRandomNumber(
        uint256 _delay,
        uint256 _roundId,
        uint256 _numbersCount,
        uint256 _maxValue,
        uint256 _nonce
    ) public {
        require( m_lotteries[msg.sender] );

        uint N = 32; // number of random bytes we want the datasource to return
        bytes32 queryId = custom_oraclize_newRandomDSQuery(_delay, N, m_callbackGas, _nonce); // this function internally generates the correct oraclize_query and returns its queryId

        m_queryDetails[queryId] = QueryDetails(_roundId, msg.sender, _numbersCount, _maxValue);
    }

    /**
     * the callback function is called by Oraclize when the result is ready
     * the oraclize_randomDS_proofVerify modifier prevents an invalid proof to execute this function code:
     * the proof validity is fully verified on-chain
     */
    function __callback(bytes32 _queryId, string _result, bytes _proof) public {
        if (msg.sender != oraclize_cbAddress()) {
            revert();
        }

        uint8 checkResult = oraclize_randomDS_proofVerify__returnCode(_queryId, _result, _proof);
        if (checkResult != 0) {
            // the proof verification has failed, do we need to take any action here? (depends on the use case)
            emit checkFailed(checkResult);
        } else {
            // the proof verification has passed
            // now that we know that the random number was safely generated, let's use it..

            //newRandomNumber_bytes(bytes(_result)); // this is the resulting random number (bytes), fails in truffle

            QueryDetails storage currQuery = m_queryDetails[_queryId];
            assert(currQuery.lottery != address(0));

            uint[] memory randomNumbers = new uint[](currQuery.numbersCount);
            for (uint256 i; i<currQuery.numbersCount; i++) {
                randomNumbers[i] = _getRandomNumber(_result, i, currQuery.maxValue);
            }
            //newRandomNumber_uint(randomNumbers); //fails in truffle

            BaseLottery(currQuery.lottery).processRound(currQuery.roundId, randomNumbers);
        }
    }

    /**
     * Get balance shortage
     */
    function getBalanceShortage() public view returns (uint256) {
        if (address(this).balance >= m_minBalance) {
            return 0;
        }

        return m_minBalance - address(this).balance;
    }


    /*************** INTERNAL *****************/

    /**
     * Get random uint number from string seed
     */
    function _getRandomNumber(string _randomStr, uint256 _num, uint256 _maxValue)
        internal
        pure
        returns (uint256)
    {
        // uniformity of distribution decreases insignificantly since 2^256 >> _maxValue
        return uint(keccak256(_randomStr, _num)) % _maxValue;
    }

    /**
     * see Multi-Party Interactions from https://docs.oraclize.it/#ethereum-advanced-topics-random-data-source
     *
     * diff to origin fn from oraclize: `timestamp` replaced with `xor(timestamp, _additionalNonce)`
     */
    function custom_oraclize_newRandomDSQuery(uint _delay, uint _nbytes, uint _customGasLimit, uint _additionalNonce)
        internal
        returns (bytes32)
    {
        require((_nbytes > 0) && (_nbytes <= 32));
        // Convert from seconds to ledger timer ticks
        _delay *= 10;
        bytes memory nbytes = new bytes(1);
        nbytes[0] = byte(_nbytes);
        bytes memory unonce = new bytes(32);
        bytes memory sessionKeyHash = new bytes(32);
        bytes32 sessionKeyHash_bytes32 = oraclize_randomDS_getSessionPubKeyHash();
        assembly {
            mstore(unonce, 0x20)
            mstore(add(unonce, 0x20), xor(blockhash(sub(number, 1)), xor(coinbase, xor(timestamp, _additionalNonce))))
            mstore(sessionKeyHash, 0x20)
            mstore(add(sessionKeyHash, 0x20), sessionKeyHash_bytes32)
        }
        bytes memory delay = new bytes(32);
        assembly {
            mstore(add(delay, 0x20), _delay)
        }

        bytes memory delay_bytes8 = new bytes(8);
        copyBytes(delay, 24, 8, delay_bytes8, 0);

        bytes[4] memory args = [unonce, nbytes, sessionKeyHash, delay];
        bytes32 queryId = oraclize_query("random", args, _customGasLimit);

        bytes memory delay_bytes8_left = new bytes(8);

        assembly {
            let x := mload(add(delay_bytes8, 0x20))
            mstore8(add(delay_bytes8_left, 0x27), div(x, 0x100000000000000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x26), div(x, 0x1000000000000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x25), div(x, 0x10000000000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x24), div(x, 0x100000000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x23), div(x, 0x1000000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x22), div(x, 0x10000000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x21), div(x, 0x100000000000000000000000000000000000000000000000000))
            mstore8(add(delay_bytes8_left, 0x20), div(x, 0x1000000000000000000000000000000000000000000000000))

        }

        oraclize_randomDS_setCommitment(queryId, keccak256(delay_bytes8_left, args[1], sha256(args[0]), args[2]));
        return queryId;
    }
}
