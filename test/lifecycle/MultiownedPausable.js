'use strict';

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


const expectThrow = require('../_helpers/expectThrow');
const MultiownedPausable = artifacts.require('MultiownedPausableHelper.sol');

contract('MultiownedPausable', function(accounts) {

    const role = {
        owner1: accounts[0],
        owner2: accounts[1],
        owner3: accounts[2],
        nobody: accounts[3]
    };

    let contract;

    beforeEach(async function() {
        contract = await MultiownedPausable.new(
            [role.owner1, role.owner2, role.owner3],

            {from: role.nobody}
        );
    });


    it('can perform normal process in non-pause', async function () {
        
        let count0 = await contract.count();
        assert.equal(count0, 0);

        await contract.normalProcess();
        let count1 = await contract.count();
        assert.equal(count1, 1);
    });

    it('can not perform normal process in pause', async function () {
        
        await contract.pause({from: role.owner1});
        let count0 = await contract.count();
        assert.equal(count0, 0);

        await expectThrow(contract.normalProcess());
        let count1 = await contract.count();
        assert.equal(count1, 0);
    });

    it('can not take drastic measure in non-pause', async function () {
        
        await expectThrow(contract.drasticMeasure());
        const drasticMeasureTaken = await contract.drasticMeasureTaken();
        assert.isFalse(drasticMeasureTaken);
    });

    it('can take a drastic measure in a pause', async function () {
        
        await contract.pause({from: role.owner1});
        await contract.drasticMeasure();
        let drasticMeasureTaken = await contract.drasticMeasureTaken();

        assert.isTrue(drasticMeasureTaken);
    });

    it('should resume allowing normal process after pause is over', async function () {
        
        await contract.pause({from: role.owner1});
        await contract.unpause({from: role.owner1});
        await expectThrow(contract.normalProcess());
        await contract.unpause({from: role.owner2});
        await contract.normalProcess();
        let count0 = await contract.count();

        assert.equal(count0, 1);
    });

    it('should prevent drastic measure after pause is over', async function () {
        
        await contract.pause({from: role.owner1});
        await contract.unpause({from: role.owner1});
        await contract.unpause({from: role.owner2});

        await expectThrow(contract.drasticMeasure());

        const drasticMeasureTaken = await contract.drasticMeasureTaken();
        assert.isFalse(drasticMeasureTaken);
    });

});

