pragma solidity ^0.4.18;

/**
 * Based on Zeppelin solidity code. Origin license:
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Smart Contract Solutions, Inc.
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import 'mixbytes-solidity/contracts/ownership/multiowned.sol';

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract MultiownedPausable is multiowned {

    /*************** FIELDS *****************/

    bool public m_paused = false;

    /*************** EVENTS *****************/

    event Pause();
    event Unpause();

    /*************** MODIFIERS *****************/

    /**
     * Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!m_paused);
        _;
    }

    /**
     * Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(m_paused);
        _;
    }

    /*************** PUBLIC *****************/

    /**
     * Called by the one of owners to pause, triggers stopped state
     */
    function pause() public onlyowner whenNotPaused {
        pauseInternal();
    }

    /**
     * Called by the owners to unpause, returns to normal state
     */
    function unpause() public onlymanyowners(keccak256(msg.data)) whenPaused {
        unpauseInternal();
    }

    /*************** PUBLIC *****************/

     /**
     * Called by the one of owners to pause, triggers stopped state
     */
    function pauseInternal() internal {
        m_paused = true;
        emit Pause();
    }

    /**
     * Called by the owners to unpause, returns to normal state
     */
    function unpauseInternal() internal {
        m_paused = false;
        emit Unpause();
    }
}