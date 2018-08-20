'use strict';
//todo test чек раунд тайм=час?

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const WeekLottery = artifacts.require('WeekLotteryHelper.sol');
const MonthLottery = artifacts.require('MonthLotteryHelper.sol');
const YearLottery = artifacts.require('YearLotteryHelper.sol');
const DayLottery = artifacts.require('DayLotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const Sender = artifacts.require('Sender.sol');

const szabo = num => web3.toWei(num, 'szabo');
const finney = num => web3.toWei(num, 'finney');

assert.equal2 = require('./_helpers/equal2');

contract('SecondLevelLotteries', function(accounts) {


    const OWNER_COMMISSION = 0.2;
    const MIN_RNG_balance = szabo(10);
    const DAY_ROUND_TIME = 24*60*60;
    const WEEK_ROUND_TIME = 7*24*60*60;
    const MONTH_ROUND_TIME = 31*24*60*60;
    const YEAR_ROUND_TIME = 366*24*60*60;

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
        mainLottery: accounts[8], //technical, same as nobody,
        oraclize: accounts[9],

        sender1: undefined,
        sender2: undefined
    };

    async function init(num) {
        let rng = await RNG.new([role.owner1, role.owner2, role.owner3], {from: role.nobody});
        let lottery, name, roundTime, initRoundId, nextRoundId, ticketCost;

        switch (num) {
            case 0:
                lottery = await DayLottery.new(
                    [role.owner1, role.owner2, role.owner3], role.ownerFunds, rng.address,
                    {from: role.nobody}
                );
                name = 'DayLottery';
                roundTime = DAY_ROUND_TIME;
                initRoundId = new Date('2018-01-01') / 1000;
                nextRoundId = new Date('2018-01-02') / 1000;
                ticketCost = szabo(10000 * 10 / 100);
                break;
            case 1:
                lottery = await WeekLottery.new(
                    [role.owner1, role.owner2, role.owner3], role.ownerFunds, rng.address,
                    {from: role.nobody}
                );
                name = 'WeekLottery';
                roundTime = WEEK_ROUND_TIME;
                initRoundId = new Date('2018-01-08') / 1000;
                nextRoundId = new Date('2018-01-15') / 1000;
                ticketCost = szabo(10000 * 5 / 100);
                break;
            case 2:
                lottery = await MonthLottery.new(
                    [role.owner1, role.owner2, role.owner3], role.ownerFunds, rng.address,
                    {from: role.nobody}
                );
                name = 'MonthLottery';
                roundTime = MONTH_ROUND_TIME;
                initRoundId = new Date('2018-01-01') / 1000;
                nextRoundId = new Date('2018-02-01') / 1000;
                ticketCost = szabo(10000 * 5 / 100);
                break;
            case 3:
                lottery = await YearLottery.new(
                    [role.owner1, role.owner2, role.owner3], role.ownerFunds, rng.address,
                    {from: role.nobody}
                );
                name = 'YearLottery';
                roundTime = YEAR_ROUND_TIME;
                initRoundId = new Date('2018-01-01') / 1000;
                nextRoundId = new Date('2019-01-01') / 1000;
                ticketCost = szabo(10000 * 5 / 100);
                break;
        }

        await lottery.setMainLottery(role.mainLottery, {from: role.owner1});
        await lottery.setMainLottery(role.mainLottery, {from: role.owner2});

        await rng.setLotteries([lottery.address, 1, 2, 3, 4, 5], {from: role.owner1});
        await rng.setLotteries([lottery.address, 1, 2, 3, 4, 5], {from: role.owner2});

        let sender1 = await Sender.new();
        let sender2 = await Sender.new();
        role.sender1 = sender1.address;
        role.sender2 = sender2.address;

        return {
            name: name,
            lottery: lottery,
            roundTime: roundTime,
            initRoundId: initRoundId,
            rng: rng,
            sender1: sender1,
            nextRoundId: nextRoundId,
            ticketCost: ticketCost,
            tickets: x => web3.toWei(Math.round(x * ticketCost), 'wei')
        }
    }

    let names = ['DayLottery', 'WeekLottery', 'MonthLottery', 'YearLottery'];

    for(let i=0; i< names.length; i++) {
        for (const [name, fn] of getTestForLotteries(() => init(i))) {
            it(names[i] + ' ' + name, fn);
        }

    }

    function getTestForLotteries(init) {

        let tests=[];

        tests.push(['Test min funds', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let ticketCost = descr.ticketCost;
            let tickets = descr.tickets

            await expectThrow(lottery.participate(role.nobody, {from: role.mainLottery, value: ticketCost - 1}));
            await lottery.participate(role.nobody, {from: role.mainLottery, value: ticketCost});

            await expectThrow(lottery.participate(role.nobody, {from: role.mainLottery, value: tickets(1) - 1}));
            await lottery.participate(role.nobody, {from: role.mainLottery, value: tickets(1)});
        }]);

        tests.push(['Not sending to another lotteries', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let tickets = descr.tickets;

            const ownerFundsBalance = await balanceOf(role.ownerFunds);
            const lotBalance = await balanceOf(lottery.address);


            await lottery.participate(role.nobody, {from: role.mainLottery, value: tickets(1.5)});

            assert.equal2(ownerFundsBalance.add(tickets(0.5)), await balanceOf(role.ownerFunds));
            assert.equal2(lotBalance.add(tickets(1)), await balanceOf(lottery.address));

        }]);

        tests.push(['Complex success test 1', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let ROUND_TIME = descr.roundTime;
            let rng = descr.rng;
            let sender1 = descr.sender1;
            let tickets = descr.tickets;

            let roundId = descr.initRoundId ;


            let lotteryInitBalance = await balanceOf(lottery.address);

            assert.equal2(0, await balanceOf(rng.address));
            await rng.setMinBalance(MIN_RNG_balance, {from: role.owner1});
            await rng.setMinBalance(MIN_RNG_balance, {from: role.owner2});

            await lottery.setCurrentTime(roundId + 1);

            await lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1)});
            await lottery.participate(role.participant2, {from: role.mainLottery, value: tickets(2)});
            await lottery.participate(role.sender1, {from: role.mainLottery, value: tickets(1)});

            assert.equal2(lotteryInitBalance.add(tickets(4)), await balanceOf(lottery.address), 'lottery balance after participation');

            let initBalances = await getInitialBalances();


            await lottery.setCurrentTime(roundId + ROUND_TIME + 1);

            //rng is winner num % tickets count
            await lottery.checkRoundEnded();
            await rng.__callCallback({from: role.oraclize});


            assert.equal2(
                initBalances.owner.add(tickets(4*OWNER_COMMISSION)).sub(MIN_RNG_balance),
                await balanceOf(role.ownerFunds),
                'owner commission sent'
            );
            assert.equal2(MIN_RNG_balance, await balanceOf(rng.address), 'rng balance added commission sent');

            const prize_share = 1-OWNER_COMMISSION;

            let getRoundWinnersRes = await lottery.getRoundWinners(roundId)
            let winners = getRoundWinnersRes[0], realPrizes = getRoundWinnersRes[1];
            assert.equal(10, winners.length, 'correct amount of winners');
            assert.equal2(role.participant1, winners[0], 'correct winner 1');
            assert.equal2(role.participant2, winners[1], 'correct winner 2');
            assert.equal2(role.participant2, winners[2], 'correct winner 3');
            assert.equal2(role.sender1, winners[3], 'correct winner 4');
            assert.equal(10, realPrizes.length, 'correct amount of prizes');
            assert.equal2(tickets(4 * prize_share * 0.5), realPrizes[0], 'correct prizes 1');
            assert.equal2(tickets(4 * prize_share * 0.25), realPrizes[1], 'correct prizes 2');
            assert.equal2(tickets(4 * prize_share * 0.125), realPrizes[2], 'correct prizes 3');
            assert.equal2(tickets(4 * prize_share * 0.062), realPrizes[3], 'correct prizes 4');
            assert.equal2(tickets(4 * prize_share * 0.001), realPrizes[9], 'correct prizes 10');


            let prizes = {
                participant1: tickets(4 * prize_share * (0.5+0.032 + 0.002)),
                participant2: tickets(4 * prize_share * (0.25+0.125 + 0.016 + 0.008+ 0.001)),
                sender1:      tickets(4 * prize_share * (0.062 +0.004))
            };

            let expectedResultBalance = {
                participant1: initBalances.participant1.add(prizes.participant1),
                participant2: initBalances.participant2.add(prizes.participant2),
                sender1: initBalances.sender1.add(prizes.sender1),
            };

            //p1 & p2 got their prize, sender1 not (contract doesn't support receiving ether).
            assert.equal2(lotteryInitBalance.add(prizes.sender1), await balanceOf(lottery.address), 'lottery balance after winner calculation');

            assert.equal2(0, await lottery.getRoundWinnerUnsentPrize(roundId, role.participant1), 'winner 1 prize was sent');
            assert.equal2(0, await lottery.getRoundWinnerUnsentPrize(roundId, role.participant2), 'winner 2 prize was sent');
            assert.equal2(prizes.sender1, await lottery.getRoundWinnerUnsentPrize(roundId, role.sender1), 'correct winner 3 prize (4+8)');

            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'prize to p1 was sent (1+5+9)');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'prize to p2 was sent (2+3 +6+7 + 10)');
            assert.equal2(initBalances.sender1,               await balanceOf(role.sender1),      'prize to s1 was not sent');


            ////get prize

            //incorrect round
            await expectThrow(sender1.getPrize(lottery.address, 33, {from: role.nobody}));
            await expectThrow(sender1.getPrize(lottery.address, 2*24*60*60, {from: role.nobody}));


            await sender1.getPrize(lottery.address, roundId, {from: role.nobody});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'prize to p1 was not sent again');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'prize to p2 was not sent again');
            assert.equal2(expectedResultBalance.sender1,      await balanceOf(role.sender1),      'prize to s1 was sent');

            //p1 and p2 have already got
            await expectThrow(lottery.getPrize(roundId, {from: role.participant1}));
            await expectThrow(lottery.getPrize(roundId, {from: role.participant2}));

            //again correct round by s1
            await expectThrow(sender1.getPrize(lottery.address, roundId, {from: role.nobody}));

            assert.equal2(lotteryInitBalance, await balanceOf(lottery.address), 'lottery balance after prize sent');
        }]);

        tests.push(['Test refund', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let ROUND_TIME = descr.roundTime;
            let rng = descr.rng;
            let sender1 = descr.sender1;
            let tickets = descr.tickets;

            let roundId = descr.initRoundId ;


            let lotteryInitBalance = await balanceOf(lottery.address);

            await lottery.setCurrentTime(roundId + 1);

            await lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1), gasPrice: 0});
            await lottery.participate(role.participant2, {from: role.mainLottery, value: tickets(2), gasPrice: 0});
            await lottery.participate(role.participant3, {from: role.mainLottery, value: tickets(1), gasPrice: 0});

            let initBalances = await getInitialBalances();


            await lottery.setCurrentTime(roundId + ROUND_TIME + 1);
            //trigger round calculation by sending ether to the next round
            //in tests random number = winner num % tickets count
            await lottery.participate(role.participant4, {from: role.mainLottery, value: tickets(1)});

            // round calculation was not called, so round refunded, contract on pause
            await lottery.setCurrentTime(roundId + 2*ROUND_TIME + 2);
            await lottery.participate(role.participant4, {from: role.mainLottery, value: tickets(1)});
            assert.equal2(true, await lottery.m_paused());

            assert.equal2(4, (await lottery.getRoundInfo(roundId))[0]);

            let getRoundWinnersRes = await lottery.getRoundWinners(roundId)
            let winners = getRoundWinnersRes[0], realPrizes = getRoundWinnersRes[1];
            assert.equal(0, winners.length, 'correct amount of winners');
            assert.equal(0, realPrizes.length, 'correct amount of prizes');

            assert.equal2(lotteryInitBalance.add(tickets(4 + 2)), await balanceOf(lottery.address), 'lottery balance after exceeded time to winner calculation');


            await expectThrow(lottery.getPrize(roundId, {from: role.participant1, gasPrice: 0}));

            let expectedResultBalance = {
                participant1: initBalances.participant1.add(tickets(1)),
                participant2: initBalances.participant2.add(tickets(2)),
                participant3: initBalances.participant3.add(tickets(1)),
            };


            //consider gas spent to call
            await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was made by p1');
            assert.equal2(initBalances.participant2, await balanceOf(role.participant2), 'refund was not got by p2');
            assert.equal2(initBalances.participant3, await balanceOf(role.participant3), 'refund was not got by p3');


            await lottery.refund(roundId, {from: role.participant2, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was made by p2');


            await lottery.refund(roundId, {from: role.participant3, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was not made by p2 again');
            assert.equal2(expectedResultBalance.participant3, await balanceOf(role.participant3), 'refund was made by p3');

            assert.equal2(lotteryInitBalance.add(tickets(2)), await balanceOf(lottery.address), 'lottery balance after refunds made');

            //again correct round
            await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
            await lottery.refund(roundId, {from: role.participant2, gasPrice: 0});
            await lottery.refund(roundId, {from: role.participant3, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was not made by p2 again');
            assert.equal2(expectedResultBalance.participant3, await balanceOf(role.participant3), 'refund was not made by p3 again');

            assert.equal2(lotteryInitBalance.add(tickets(2)), await balanceOf(lottery.address), 'lottery balance after refunds made');

            // throw on participation when paused
            await expectThrow(lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1)}));
        }]);



        tests.push(['test pause and manual set refund state', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let ROUND_TIME = descr.roundTime;
            let rng = descr.rng;
            let sender1 = descr.sender1;
            let tickets = descr.tickets;

            let roundId = descr.initRoundId ;


            let lotteryInitBalance = await balanceOf(lottery.address);
            await lottery.setCurrentTime(roundId + 1);

            await lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1), gasPrice: 0});

            let initBalances = await getInitialBalances();

            //not paused
            await expectThrow(lottery.setRefundStateToRound(roundId, {from: role.owner1}));

            //invalid round id
            await expectThrow(lottery.setRefundStateToRound(333, {from: role.owner1}));

            await lottery.pause({from: role.owner1});

            //no participation on pause
            await expectThrow(lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1), gasPrice: 0}));

            let expectedResultBalance = {
                participant1: initBalances.participant1.add(tickets(1)),
            };

            //no refund on pause
            await expectThrow(lottery.refund(roundId, {from: role.participant1, gasPrice: 0}));

            await lottery.setRefundStateToRound(roundId, {from: role.owner1});
            await lottery.setRefundStateToRound(roundId, {from: role.owner2});


            //consider gas spent to call
            await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was made by p1');

            assert.equal2(lotteryInitBalance, await balanceOf(lottery.address), 'lottery balance after refunds made');


            //again correct round
            let p1balance = await balanceOf(role.participant1);
            await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
            assert.equal2(p1balance, await balanceOf(role.participant1), 'refund was not made by p1 again');

            assert.equal2(lotteryInitBalance, await balanceOf(lottery.address), 'lottery balance after refunds made');

        }]);


        tests.push(['test refund last rounds and check last rounds processed', async function() {
            let descr = await init();
            let lottery = descr.lottery;
            let ROUND_TIME = descr.roundTime;
            let rng = descr.rng;
            let sender1 = descr.sender1;
            let tickets = descr.tickets;

            let roundId = descr.initRoundId ;
            let nextRoundId = descr.nextRoundId;


            let lotteryInitBalance = await balanceOf(lottery.address);
            await lottery.setCurrentTime(roundId + 1);

            await lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1), gasPrice: 0});
            await lottery.participate(role.participant2, {from: role.mainLottery, value: tickets(1), gasPrice: 0});

            await lottery.setCurrentTime(roundId + ROUND_TIME + 1);

            await lottery.participate(role.participant1, {from: role.mainLottery, value: tickets(1), gasPrice: 0});
            await lottery.participate(role.participant3, {from: role.mainLottery, value: tickets(1), gasPrice: 0});

            await lottery.setCurrentTime(roundId + ROUND_TIME*2 + 2);


            await lottery.checkLastRoundsProcessed(5);

            await lottery.setRefundStateToRound(nextRoundId, {from: role.owner1});
            await lottery.setRefundStateToRound(nextRoundId, {from: role.owner2});


            assert.equal2(
                4,//refund
                (await lottery.getRoundInfo(roundId))[0]
            );
            assert.equal2(
                4,//refund
                (await lottery.getRoundInfo(nextRoundId))[0]
            );


            let initBalances = await getInitialBalances();
            let expectedResultBalance = {
                participant1: initBalances.participant1.add(tickets(2)),
                participant2: initBalances.participant2.add(tickets(1)),
                participant3: initBalances.participant3.add(tickets(1)),
            };



            await lottery.refundLastRounds(5, {from: role.participant1, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was made by p1');
            assert.equal2(initBalances.participant2, await balanceOf(role.participant2), 'refund was not made to p2');
            assert.equal2(initBalances.participant3, await balanceOf(role.participant3), 'refund was not made to p3');

            await lottery.refundLastRounds(5, {from: role.participant1, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again');
            assert.equal2(initBalances.participant2, await balanceOf(role.participant2), 'refund was not made to p2 2');
            assert.equal2(initBalances.participant3, await balanceOf(role.participant3), 'refund was not made to p3 2');

            await lottery.refundLastRounds(5, {from: role.participant2, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again 2');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was made by p2');
            assert.equal2(initBalances.participant3, await balanceOf(role.participant3), 'refund was not made to p3');

            await lottery.refundLastRounds(5, {from: role.participant3, gasPrice: 0});
            assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again 3');
            assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was not made by p2 again');
            assert.equal2(expectedResultBalance.participant3, await balanceOf(role.participant3), 'refund was made by p3');

        }]);

        return tests;
    }

    const getInitialBalances = async function () {
        return {
            owner: await balanceOf(role.ownerFunds),
            participant1: await balanceOf(role.participant1),
            participant2: await balanceOf(role.participant2),
            participant3: await balanceOf(role.participant3),
            participant4: await balanceOf(role.participant4),
            sender1: await balanceOf(role.sender1),
            sender2: await balanceOf(role.sender2),
        }
    };


});

