'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const Lottery = artifacts.require('MonthLotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const Sender = artifacts.require('Sender.sol');

assert.equal2 = require('./_helpers/equal2');

contract('MonthLottery', function(accounts) {

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
        rounds[d('2018-02-01')]          = d('2018-02-01');
        rounds[d('2018-03-01')]          = d('2018-03-01');
        rounds[d('2018-04-01')]          = d('2018-04-01');
        rounds[d('2018-05-01')]          = d('2018-05-01');
        rounds[d('2018-06-01')]          = d('2018-06-01');
        rounds[d('2018-07-01')]          = d('2018-07-01');
        rounds[d('2018-08-01')]          = d('2018-08-01');
        rounds[d('2018-09-01')]          = d('2018-09-01');
        rounds[d('2018-10-01')]          = d('2018-10-01');
        rounds[d('2018-11-01')]          = d('2018-11-01');
        rounds[d('2018-12-01')]          = d('2018-12-01');

        rounds[d('2018-01-31 23:59:59')] = d('2018-01-01');
        rounds[d('2018-02-28 23:59:59')] = d('2018-02-01');
        rounds[d('2018-03-31 23:59:59')] = d('2018-03-01');
        rounds[d('2018-04-30 23:59:59')] = d('2018-04-01');
        rounds[d('2018-05-31 23:59:59')] = d('2018-05-01');
        rounds[d('2018-06-30 23:59:59')] = d('2018-06-01');
        rounds[d('2018-07-31 23:59:59')] = d('2018-07-01');
        rounds[d('2018-08-31 23:59:59')] = d('2018-08-01');
        rounds[d('2018-09-30 23:59:59')] = d('2018-09-01');
        rounds[d('2018-10-31 23:59:59')] = d('2018-10-01');
        rounds[d('2018-11-30 23:59:59')] = d('2018-11-01');
        rounds[d('2018-12-31 23:59:59')] = d('2018-12-01');

        rounds[d('2019-01-01')]          = d('2019-01-01');
        rounds[d('2019-02-01')]          = d('2019-02-01');
        rounds[d('2019-03-01')]          = d('2019-03-01');
        rounds[d('2019-04-01')]          = d('2019-04-01');
        rounds[d('2019-05-01')]          = d('2019-05-01');
        rounds[d('2019-06-01')]          = d('2019-06-01');
        rounds[d('2019-07-01')]          = d('2019-07-01');
        rounds[d('2019-08-01')]          = d('2019-08-01');
        rounds[d('2019-09-01')]          = d('2019-09-01');
        rounds[d('2019-10-01')]          = d('2019-10-01');
        rounds[d('2019-11-01')]          = d('2019-11-01');
        rounds[d('2019-12-01')]          = d('2019-12-01');

        rounds[d('2019-01-31 23:59:59')] = d('2019-01-01');
        rounds[d('2019-02-28 23:59:59')] = d('2019-02-01');
        rounds[d('2019-03-31 23:59:59')] = d('2019-03-01');
        rounds[d('2019-04-30 23:59:59')] = d('2019-04-01');
        rounds[d('2019-05-31 23:59:59')] = d('2019-05-01');
        rounds[d('2019-06-30 23:59:59')] = d('2019-06-01');
        rounds[d('2019-07-31 23:59:59')] = d('2019-07-01');
        rounds[d('2019-08-31 23:59:59')] = d('2019-08-01');
        rounds[d('2019-09-30 23:59:59')] = d('2019-09-01');
        rounds[d('2019-10-31 23:59:59')] = d('2019-10-01');
        rounds[d('2019-11-30 23:59:59')] = d('2019-11-01');
        rounds[d('2019-12-31 23:59:59')] = d('2019-12-01');

        rounds[d('2020-01-01')]          = d('2020-01-01');
        rounds[d('2020-02-01')]          = d('2020-02-01');
        rounds[d('2020-03-01')]          = d('2020-03-01');
        rounds[d('2020-01-31 23:59:59')] = d('2020-01-01');
        rounds[d('2020-02-29 23:59:59')] = d('2020-02-01');
        rounds[d('2020-03-31 23:59:59')] = d('2020-03-01');

        rounds[d('2028-01-01')]          = d('2028-01-01');
        rounds[d('2028-02-01')]          = d('2028-02-01');
        rounds[d('2028-03-01')]          = d('2028-03-01');
        rounds[d('2028-04-01')]          = d('2028-04-01');
        rounds[d('2028-05-01')]          = d('2028-05-01');
        rounds[d('2028-06-01')]          = d('2028-06-01');
        rounds[d('2028-07-01')]          = d('2028-07-01');
        rounds[d('2028-08-01')]          = d('2028-08-01');
        rounds[d('2028-09-01')]          = d('2028-09-01');
        rounds[d('2028-10-01')]          = d('2028-10-01');
        rounds[d('2028-11-01')]          = d('2028-11-01');
        rounds[d('2028-12-01')]          = d('2028-12-01');

        rounds[d('2028-01-31 23:59:59')] = d('2028-01-01');
        rounds[d('2028-02-29 23:59:59')] = d('2028-02-01');
        rounds[d('2028-03-31 23:59:59')] = d('2028-03-01');
        rounds[d('2028-04-30 23:59:59')] = d('2028-04-01');
        rounds[d('2028-05-31 23:59:59')] = d('2028-05-01');
        rounds[d('2028-06-30 23:59:59')] = d('2028-06-01');
        rounds[d('2028-07-31 23:59:59')] = d('2028-07-01');
        rounds[d('2028-08-31 23:59:59')] = d('2028-08-01');
        rounds[d('2028-09-30 23:59:59')] = d('2028-09-01');
        rounds[d('2028-10-31 23:59:59')] = d('2028-10-01');
        rounds[d('2028-11-30 23:59:59')] = d('2028-11-01');
        rounds[d('2028-12-31 23:59:59')] = d('2028-12-01');

        for (let k in rounds) {
            if (!rounds.hasOwnProperty(k)) continue;

            await lottery.setCurrentTime(k);
            assert.equal2(rounds[k], await lottery.getCurrentRoundId.call());
        }
    });

});

