'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const Lottery = artifacts.require('YearLotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const Sender = artifacts.require('Sender.sol');

assert.equal2 = require('./_helpers/equal2');

contract('YearLottery', function(accounts) {

    const role = {
        owner1: accounts[0],
        owner2: accounts[1],
        owner3: accounts[2],
        ownerFunds: accounts[3],
        participant1: accounts[4],
        participant2: accounts[5],
        participant3: accounts[6],
        participant4: accounts[7],

        nobody: accounts[8],
        oraclize: accounts[9]
    };

    let lottery;

    beforeEach(async function() {
        lottery = await Lottery.new(
            [role.owner1, role.owner2, role.owner3],
            role.ownerFunds,
            1,

            {from: role.nobody}
        );
    });


    it("Test get current round", async function() {
        const d = date => new Date(date) / 1000;
        const rounds = [];
        rounds[d('2018-01-01 13:51:51')] = d('2018-01-01');
        rounds[d('2020-01-01 13:51:51')] = d('2020-01-01');

        rounds[d('2018-01-01')]          = d('2018-01-01');
        rounds[d('2019-01-01')]          = d('2019-01-01');
        rounds[d('2020-01-01')]          = d('2020-01-01');
        rounds[d('2021-01-01')]          = d('2021-01-01');
        rounds[d('2022-01-01')]          = d('2022-01-01');
        rounds[d('2023-01-01')]          = d('2023-01-01');
        rounds[d('2024-01-01')]          = d('2024-01-01');
        rounds[d('2025-01-01')]          = d('2025-01-01');

        rounds[d('2018-07-31 23:59:59')] = d('2018-01-01');
        rounds[d('2019-07-31 23:59:59')] = d('2019-01-01');
        rounds[d('2020-07-31 23:59:59')] = d('2020-01-01');
        rounds[d('2021-07-31 23:59:59')] = d('2021-01-01');
        rounds[d('2022-07-31 23:59:59')] = d('2022-01-01');
        rounds[d('2023-07-31 23:59:59')] = d('2023-01-01');
        rounds[d('2024-07-31 23:59:59')] = d('2024-01-01');
        rounds[d('2025-07-31 23:59:59')] = d('2025-01-01');

        rounds[d('2018-12-31 23:59:59')] = d('2018-01-01');
        rounds[d('2019-12-31 23:59:59')] = d('2019-01-01');
        rounds[d('2020-12-31 23:59:59')] = d('2020-01-01');
        rounds[d('2021-12-31 23:59:59')] = d('2021-01-01');
        rounds[d('2022-12-31 23:59:59')] = d('2022-01-01');
        rounds[d('2023-12-31 23:59:59')] = d('2023-01-01');
        rounds[d('2024-12-31 23:59:59')] = d('2024-01-01');
        rounds[d('2025-12-31 23:59:59')] = d('2025-01-01');

        rounds[d('2118-01-01')]          = d('2118-01-01');
        rounds[d('2119-01-01')]          = d('2119-01-01');
        rounds[d('2120-01-01')]          = d('2120-01-01');
        rounds[d('2121-01-01')]          = d('2121-01-01');
        rounds[d('2122-01-01')]          = d('2122-01-01');
        rounds[d('2123-01-01')]          = d('2123-01-01');
        rounds[d('2124-01-01')]          = d('2124-01-01');
        rounds[d('2125-01-01')]          = d('2125-01-01');

        rounds[d('2118-07-31 23:59:59')] = d('2118-01-01');
        rounds[d('2119-07-31 23:59:59')] = d('2119-01-01');
        rounds[d('2120-07-31 23:59:59')] = d('2120-01-01');
        rounds[d('2121-07-31 23:59:59')] = d('2121-01-01');
        rounds[d('2122-07-31 23:59:59')] = d('2122-01-01');
        rounds[d('2123-07-31 23:59:59')] = d('2123-01-01');
        rounds[d('2124-07-31 23:59:59')] = d('2124-01-01');
        rounds[d('2125-07-31 23:59:59')] = d('2125-01-01');

        rounds[d('2118-12-31 23:59:59')] = d('2118-01-01');
        rounds[d('2119-12-31 23:59:59')] = d('2119-01-01');
        rounds[d('2120-12-31 23:59:59')] = d('2120-01-01');
        rounds[d('2121-12-31 23:59:59')] = d('2121-01-01');
        rounds[d('2122-12-31 23:59:59')] = d('2122-01-01');
        rounds[d('2123-12-31 23:59:59')] = d('2123-01-01');
        rounds[d('2124-12-31 23:59:59')] = d('2124-01-01');
        rounds[d('2125-12-31 23:59:59')] = d('2125-01-01');

        rounds[d('2018-07-28 23:59:59')] = d('2018-01-01');
        rounds[d('2018-02-28 23:59:59')] = d('2018-01-01');
        rounds[d('2030-01-30 23:59:59')] = d('2030-01-01');

        rounds[d('2050-02-28 23:59:59')] = d('2050-01-01');

        for (let k in rounds) {
            if (!rounds.hasOwnProperty(k)) continue;

            await lottery.setCurrentTime(k);
            assert.equal2(rounds[k], await lottery.getCurrentRoundId.call());
        }
    });

});

