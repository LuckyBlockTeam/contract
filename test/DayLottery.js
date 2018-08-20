'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const Lottery = artifacts.require('DayLotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const SecondLevelLotteryMock = artifacts.require('SecondLevelLotteryMock.sol');
const Sender = artifacts.require('Sender.sol');

assert.equal2 = require('./_helpers/equal2');

contract('DayLottery', function(accounts) {

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
        oraclize: accounts[9],

        sender1: undefined,
        sender2: undefined
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
        const rounds = {};
        rounds[d('2018-01-01 13:51:51')] = d('2018-01-01');
        rounds[d('2020-01-01 13:51:51')] = d('2020-01-01');
        rounds[d('2018-01-01')]          = d('2018-01-01');
        rounds[d('2018-01-01 23:59:59')] = d('2018-01-01');
        rounds[d('2018-02-28 23:59:59')] = d('2018-02-28');


        for (let k in rounds) {
            if (!rounds.hasOwnProperty(k)) continue;

            await lottery.setCurrentTime(k);
            assert.equal2(rounds[k], await lottery.getCurrentRoundId.call());
        }
    });

});

