'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const Lottery = artifacts.require('BaseLotteryHelper.sol');

assert.equal2 = require('./_helpers/equal2');

contract('BaseLottery', function(accounts) {

    const role = {
        owner1: accounts[0],
        owner2: accounts[1],
        owner3: accounts[2],
        ownerFunds: accounts[3],
        lottery1: accounts[4],
        lottery2: accounts[5],
        lottery3: accounts[6],

        nobody: accounts[8],
    };

    let lottery, lot1, lot2, lot3;

    beforeEach(async function() {
        lottery = await Lottery.new(
            [role.owner1, role.owner2, role.owner3],
            role.ownerFunds,
            1, //rng addr

            {from: role.nobody}
        );
    });


    it("Test change profit address", async function() {
        assert.equal2(await lottery.m_profitAddress(), role.ownerFunds);

        await expectThrow(
            lottery.setProfitAddress(role.owner1, {from: role.nobody})
        );

        await lottery.setProfitAddress(role.owner1, {from: role.owner1});
        assert.equal2(await lottery.m_profitAddress(), role.ownerFunds);

        await lottery.setProfitAddress(role.owner1, {from: role.owner2});
        assert.equal2(await lottery.m_profitAddress(), role.owner1);

    });

    it("Test binary search", async function() {
        const pushTickets = async function(roundId) {
            const tickets = [//addr, before, count
                [1, 0,  5],
                [2, 5,  5],
                [3, 10, 5],
                [4, 15, 2],
                [5, 17, 1],
                [6, 18, 3],
            ];
            for(let k in tickets) {
                if (!tickets.hasOwnProperty(k)) continue;
                await lottery.pushToRoundTickets(
                    roundId, tickets[k][0], tickets[k][1], tickets[k][2]
                );
            }

        };
        const cases = [ //randomNumber, correctAddr, caseDescr
            [0,  1,  "rand = minimum"],
            [2,  1,  "middle of the first interval"],
            [4,  1,  "right edge of the first interval"],
            [5,  2,  "left edge of the second interval"],
            [9,  2,  "right edge of the second interval"],
            [17, 5,  "interval from 1 ticket"],
            [18, 6,  "left edge of the last interval"],
            [19, 6,  "middle of the last interval"],
            [20, 6,  "rand = maximum"],
            [21, 0,  "rand > maximum"],
        ];
        let roundId = 777;
        for(let k in cases) {
            if(!cases.hasOwnProperty(k)) continue;
            await pushTickets(++roundId);

            assert.equal(
                cases[k][1],

                await lottery.findWinnerPublic.call(roundId, cases[k][0]),
                cases[k][2]
            )


        }

    });

    it("Test binary search extreme case: 1 ticket", async function() {
        // roundId, addr, before, count
        await lottery.pushToRoundTickets(777, 11111, 0, 1);
        assert.equal(11111, await lottery.findWinnerPublic.call(777, 0));

        await lottery.pushToRoundTickets(778, 22222, 0, 10);
        for (const RN of [0, 1, 5, 8, 9])
            assert.equal(22222, await lottery.findWinnerPublic.call(778, RN));
    });

    it("Test binary search extreme case: 2 tickets", async function() {
        // roundId, addr, before, count
        await lottery.pushToRoundTickets(777, 11111, 0, 1);
        await lottery.pushToRoundTickets(777, 22222, 1, 1);
        assert.equal(11111, await lottery.findWinnerPublic.call(777, 0));
        assert.equal(22222, await lottery.findWinnerPublic.call(777, 1));

        await lottery.pushToRoundTickets(778, 33333, 0, 10);
        await lottery.pushToRoundTickets(778, 44444, 10, 5);
        for (const RN of [0, 1, 5, 8, 9])
            assert.equal(33333, await lottery.findWinnerPublic.call(778, RN));
        for (const RN of [10, 11, 12, 13, 14])
            assert.equal(44444, await lottery.findWinnerPublic.call(778, RN));
    });


});