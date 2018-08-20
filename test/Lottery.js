'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const Lottery = artifacts.require('LotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const SecondLevelLotteryMock = artifacts.require('SecondLevelLotteryMock.sol');
const Sender = artifacts.require('Sender.sol');

assert.equal2 = require('./_helpers/equal2');

contract('Lottery', function(accounts) {

    const ROUND_TIME = 60*60;
    const ROUND_PROCESS_TIME = 24*60*60;
    const STAYED_ON_LOTTERY = 0.7; // 10+5+5+5% = 30% will be sent to second level lotteries
    const PRIZE_SHARE = 0.50;

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

    let lottery, rng, lot1, lot2, lot3, lot4, lot5, sender1, sender2;

    beforeEach(async function() {
        rng = await RNG.new([role.owner1, role.owner2, role.owner3], {from: role.nobody});
        lot1 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, 1);
        lot2 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, 1);
        lot3 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, 1);
        lot4 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, 1);
        lot5 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, 1);

        lottery = await Lottery.new(
            [role.owner1, role.owner2, role.owner3],
            role.ownerFunds,
            rng.address,
            lot1.address,
            lot2.address,
            lot3.address,
            lot4.address,
            lot5.address,

            {from: role.nobody}
        );

        await rng.setLotteries([lottery.address, 1, 2, 3, 4, 5], {from: role.owner1});
        await rng.setLotteries([lottery.address, 1, 2, 3, 4, 5], {from: role.owner2});

        sender1 = await Sender.new();
        sender2 = await Sender.new();
        role.sender1 = sender1.address;
        role.sender2 = sender2.address;
    });

    it("Check percents sum", async function() {
        assert.equal2(
            30,
            (await lottery.DAY_LOTTERY_SHARE())
                .add(await lottery.WEEK_LOTTERY_SHARE())
                .add(await lottery.MONTH_LOTTERY_SHARE())
                .add(await lottery.YEAR_LOTTERY_SHARE())
                .add(await lottery.CAPPED_LOTTERY_SHARE())
                .div(await lottery.LOTTERY_SHARE_DENOMINATOR())
                .mul(100)
        )
    });


    it("Test get current round", async function() {
        const d = date => new Date(date) / 1000;
        const rounds = {};
        rounds[d('2018-01-01 13:51:51')] = d('2018-01-01 13:00:00');
        rounds[d('2020-01-01 13:59:59')] = d('2020-01-01 13:00:00');
        rounds[d('2018-01-01 13:00:00')] = d('2018-01-01 13:00:00');


        for (let k in rounds) {
            if (!rounds.hasOwnProperty(k)) continue;

            await lottery.setCurrentTime(k);
            assert.equal2(rounds[k], await lottery.getCurrentRoundId.call());
        }
    });

    it("Test min funds", async function() {

        await expectThrow(lottery.sendTransaction({from: role.nobody, value: finney(9)}));
        await lottery.sendTransaction({from: role.nobody, value: finney(10)});

    });


    it("Test sending to another lotteries and not whole sum to lottery org", async function() {

        const ownerFundsBalance = await balanceOf(role.ownerFunds);
        const lot1Balance = await balanceOf(lot1.address);
        const lot2Balance = await balanceOf(lot2.address);
        const lot3Balance = await balanceOf(lot3.address);
        const lot4Balance = await balanceOf(lot4.address);
        const lot5Balance = await balanceOf(lot4.address);

        await lottery.sendTransaction({from: role.nobody, value: finney(14)});

        // 10 5 5 5 5
        assert.equal2(ownerFundsBalance.add(finney(4)), await balanceOf(role.ownerFunds));
        assert.equal2(lot1Balance.add(szabo(1000)), await balanceOf(lot1.address));
        assert.equal2(lot2Balance.add(szabo(500)), await balanceOf(lot2.address));
        assert.equal2(lot3Balance.add(szabo(500)), await balanceOf(lot3.address));
        assert.equal2(lot4Balance.add(szabo(500)), await balanceOf(lot4.address));
        assert.equal2(lot5Balance.add(szabo(500)), await balanceOf(lot4.address));

    });

    it("test get rounds ids", async function() {
      let round1 = new Date('2018-01-03') / 1000;
      let round2 = round1 + ROUND_TIME;
      let round3 = round1 + ROUND_TIME*2;
      let round4 = round1 + ROUND_TIME*3;

      await lottery.setCurrentTime(round1 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      await lottery.setCurrentTime(round2 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      await lottery.setCurrentTime(round3 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      await lottery.setCurrentTime(round4 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      let res = await lottery.getRoundsIds(0, 4);
      assert.equal2(round1, res[0]);
      assert.equal2(round2, res[1]);
      assert.equal2(round3, res[2]);
      assert.equal2(round4, res[3]);

      await expectThrow(lottery.getRoundsIds(0, 5));
      await expectThrow(lottery.getRoundsIds(1, 4));
      await expectThrow(lottery.getRoundsIds(0, 0));
      await expectThrow(lottery.getRoundsIds(4, 1));

      res = await lottery.getRoundsIds(3, 1);
      assert.equal2(round4, res[0]);

      res = await lottery.getRoundsIds(0, 1);
      assert.equal2(round1, res[0]);

      res = await lottery.getRoundsIds(2, 2);
      assert.equal2(round3, res[0]);
      assert.equal2(round4, res[1]);

    });

    it("test retrieving participants info", async function() {
      let round1 = new Date('2018-01-03') / 1000;
      let round2 = round1 + ROUND_TIME;
      let round3 = round1 + ROUND_TIME*2;
      let round4 = round1 + ROUND_TIME*3;
      let res;

      await lottery.setCurrentTime(round1 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      assert.equal2(1, await lottery.getRoundParticipantsCount(round1));

      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round1, role.participant1));
      assert.equal2(0, await lottery.getRoundParticipantFunds(round1, role.participant2));
      assert.equal2(0, await lottery.getRoundParticipantFunds(round1, role.participant3));

      res = await lottery.getRoundParticipants(round1, 0, 1);
      assert.equal2(role.participant1, res[0]);
      await expectThrow(lottery.getRoundParticipants(round1, 0, 0));
      await expectThrow(lottery.getRoundParticipants(round1, 1, 1));
      await expectThrow(lottery.getRoundParticipants(round1, 0, 2));





      await lottery.setCurrentTime(round2 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});
      await lottery.sendTransaction({from: role.participant2, value: finney(10)});

      assert.equal2(2, await lottery.getRoundParticipantsCount(round2));

      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round2, role.participant1));
      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round2, role.participant2));
      assert.equal2(0, await lottery.getRoundParticipantFunds(round2, role.participant3));

      res = await lottery.getRoundParticipants(round2, 0, 2);
      assert.equal2(role.participant1, res[0]);
      assert.equal2(role.participant2, res[1]);
      res = await lottery.getRoundParticipants(round2, 0, 1);
      assert.equal2(role.participant1, res[0]);
      res = await lottery.getRoundParticipants(round2, 1, 1);
      assert.equal2(role.participant2, res[0]);

      await expectThrow(lottery.getRoundParticipants(round2, 0, 3));
      await expectThrow(lottery.getRoundParticipants(round2, 1, 2));
      await expectThrow(lottery.getRoundParticipants(round2, 2, 1));



      await lottery.setCurrentTime(round3 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});
      await lottery.sendTransaction({from: role.participant2, value: finney(10)});
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});

      assert.equal2(2, await lottery.getRoundParticipantsCount(round3));

      assert.equal2(finney(20 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round3, role.participant1));
      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round3, role.participant2));
      assert.equal2(0, await lottery.getRoundParticipantFunds(round3, role.participant3));

      res = await lottery.getRoundParticipants(round3, 0, 2);
      assert.equal2(role.participant1, res[0]);
      assert.equal2(role.participant2, res[1]);
      res = await lottery.getRoundParticipants(round3, 0, 1);
      assert.equal2(role.participant1, res[0]);
      res = await lottery.getRoundParticipants(round3, 1, 1);
      assert.equal2(role.participant2, res[0]);




      await lottery.setCurrentTime(round4 + 1);
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});
      await lottery.sendTransaction({from: role.participant2, value: finney(10)});
      await lottery.sendTransaction({from: role.participant1, value: finney(10)});
      await lottery.sendTransaction({from: role.participant3, value: finney(10)});

      assert.equal2(3, await lottery.getRoundParticipantsCount(round4));

      assert.equal2(finney(20 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round4, role.participant1));
      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round4, role.participant2));
      assert.equal2(finney(10 * STAYED_ON_LOTTERY), await lottery.getRoundParticipantFunds(round4, role.participant3));

      res = await lottery.getRoundParticipants(round4, 0, 3);
      assert.equal2(role.participant1, res[0]);
      assert.equal2(role.participant2, res[1]);
      assert.equal2(role.participant3, res[2]);
      res = await lottery.getRoundParticipants(round4, 0, 2);
      assert.equal2(role.participant1, res[0]);
      assert.equal2(role.participant2, res[1]);
      res = await lottery.getRoundParticipants(round4, 1, 2);
      assert.equal2(role.participant2, res[0]);
      assert.equal2(role.participant3, res[1]);
      res = await lottery.getRoundParticipants(round4, 1, 1);
      assert.equal2(role.participant2, res[0]);
    });

    it("complex success test 1", async function() {
        let roundId = new Date('2018-01-03') / 1000 ;


        let lotteryInitBalance = await balanceOf(lottery.address);

        assert.equal2(0, await balanceOf(rng.address));
        await rng.setMinBalance(finney(1), {from: role.owner1});
        await rng.setMinBalance(finney(1), {from: role.owner2});

        await lottery.setCurrentTime(roundId + 1);

        await lottery.sendTransaction({from: role.participant1, value: finney(10)});
        await lottery.sendTransaction({from: role.participant2, value: finney(20)});
        await sender1.sendTo(lottery.address, finney(10), {from: role.nobody, value: finney(10)});
        assert.equal2(lotteryInitBalance.add(finney(40*STAYED_ON_LOTTERY)), await balanceOf(lottery.address), 'lottery balance after participation');

        let initBalances = await getInitialBalances();


        await lottery.setCurrentTime(roundId + ROUND_TIME + 1);

        //rng is winner num % tickets count
        await lottery.checkRoundEnded();
        await rng.__callCallback({from: role.oraclize});


        assert.equal2(initBalances.owner.add(finney(40*0.2 - 1)), await balanceOf(role.ownerFunds), 'owner commission sent');
        assert.equal2(finney(1), await balanceOf(rng.address), 'rng balance added commission sent');

        let getRoundWinnersRes = await lottery.getRoundWinners(roundId);
        let winners = getRoundWinnersRes[0], realPrizes = getRoundWinnersRes[1];
        assert.equal(10, winners.length, 'correct amount of winners');
        assert.equal2(role.participant1, winners[0], 'correct winner 1');
        assert.equal2(role.participant2, winners[1], 'correct winner 2');
        assert.equal2(role.participant2, winners[2], 'correct winner 3');
        assert.equal2(role.sender1, winners[3], 'correct winner 4');
        assert.equal(10, realPrizes.length, 'correct amount of prizes');
        assert.equal2(szabo(40000 * PRIZE_SHARE * 0.5), realPrizes[0], 'correct prizes 1');
        assert.equal2(szabo(40000 * PRIZE_SHARE * 0.25), realPrizes[1], 'correct prizes 2');
        assert.equal2(szabo(40000 * PRIZE_SHARE * 0.125), realPrizes[2], 'correct prizes 3');
        assert.equal2(szabo(40000 * PRIZE_SHARE * 0.062), realPrizes[3], 'correct prizes 4');
        assert.equal2(szabo(40000 * PRIZE_SHARE * 0.001), realPrizes[9], 'correct prizes 10');

        let prizes = {
            participant1: szabo(40000 * PRIZE_SHARE * (0.5+0.032 + 0.002)),
            participant2: szabo(40000 * PRIZE_SHARE * (0.25+0.125 + 0.016 + 0.008+ 0.001)),
            sender1:      szabo(40000 * PRIZE_SHARE * (0.062 +0.004))
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

    });

    it("test refund", async function() {
        let roundId = new Date('2018-01-03') / 1000;


        let lotteryInitBalance = await balanceOf(lottery.address);

        await lottery.setCurrentTime(roundId + 1);

        await lottery.sendTransaction({from: role.participant1, value: finney(10)});
        await lottery.sendTransaction({from: role.participant2, value: finney(20)});
        await lottery.sendTransaction({from: role.participant3, value: finney(10)});

        let initBalances = await getInitialBalances();


        await lottery.setCurrentTime(roundId + ROUND_TIME + 1);
        //trigger round calculation by sending ether to the next round
        //in tests random number = winner num % tickets count
        await lottery.sendTransaction({from: role.participant4, value: finney(10)});

        // round calculation was not called, so round refunded, contract on pause
        await lottery.setCurrentTime(roundId + ROUND_TIME + ROUND_PROCESS_TIME + 2);
        await lottery.sendTransaction({from: role.participant4, value: finney(10)});
        assert.equal2(true, await lottery.m_paused());

        assert.equal2(4, (await lottery.getRoundInfo(roundId))[0]);

        let getRoundWinnersRes = await lottery.getRoundWinners(roundId);
        let winners = getRoundWinnersRes[0], realPrizes = getRoundWinnersRes[1];
        assert.equal(0, winners.length, 'correct amount of winners');
        assert.equal(0, realPrizes.length, 'correct amount of prizes');

        assert.equal2(lotteryInitBalance.add(finney(40*STAYED_ON_LOTTERY + 20*STAYED_ON_LOTTERY)), await balanceOf(lottery.address), 'lottery balance after exceeded time to winner calculation');

        await expectThrow(lottery.getPrize(roundId, {from: role.participant1, gasPrice: 0}));

        let expectedResultBalance = {
            participant1: initBalances.participant1.add(finney(10*STAYED_ON_LOTTERY)),
            participant2: initBalances.participant2.add(finney(20*STAYED_ON_LOTTERY)),
            participant3: initBalances.participant3.add(finney(10*STAYED_ON_LOTTERY)),
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

        assert.equal2(lotteryInitBalance.add(finney(20*STAYED_ON_LOTTERY)), await balanceOf(lottery.address), 'lottery balance after refunds made');

        //again correct round
        await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
        await lottery.refund(roundId, {from: role.participant2, gasPrice: 0});
        await lottery.refund(roundId, {from: role.participant3, gasPrice: 0});
        assert.equal2(expectedResultBalance.participant1, await balanceOf(role.participant1), 'refund was not made by p1 again');
        assert.equal2(expectedResultBalance.participant2, await balanceOf(role.participant2), 'refund was not made by p2 again');
        assert.equal2(expectedResultBalance.participant3, await balanceOf(role.participant3), 'refund was not made by p3 again');

        assert.equal2(lotteryInitBalance.add(finney(20*STAYED_ON_LOTTERY)), await balanceOf(lottery.address), 'lottery balance after refunds made');

        // throw on participation when paused
        await expectThrow(lottery.sendTransaction({from: role.participant1, value: finney(10)}));
    });


    it("test pause and manual set refund state", async function() {
        let roundId = new Date('2018-01-03') / 1000;


        let lotteryInitBalance = await balanceOf(lottery.address);
        await lottery.setCurrentTime(roundId + 1);

        await lottery.sendTransaction({from: role.participant1, value: finney(10), gasPrice: 0});

        let initBalances = await getInitialBalances();

        //not paused
        await expectThrow(lottery.setRefundStateToRound(roundId, {from: role.owner1}));

        //invalid round id
        await expectThrow(lottery.setRefundStateToRound(333, {from: role.owner1, gasPrice: 0}));

        await lottery.pause({from: role.owner1});

        //no participation on pause
        await expectThrow(lottery.sendTransaction({from: role.participant1, value: finney(10), gasPrice: 0}));

        let expectedResultBalance = {
            participant1: initBalances.participant1.add(finney(10*STAYED_ON_LOTTERY)),
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
        let p1balance = await balanceOf(role.participant1)
        await lottery.refund(roundId, {from: role.participant1, gasPrice: 0});
        assert.equal2(p1balance, await balanceOf(role.participant1), 'refund was not made by p1 again');

        assert.equal2(lotteryInitBalance, await balanceOf(lottery.address), 'lottery balance after refunds made');

    });


    it("test refund last rounds and check last rounds processed", async function() {
        let roundId = new Date('2018-01-03') / 1000;


        let lotteryInitBalance = await balanceOf(lottery.address);
        await lottery.setCurrentTime(roundId + 1);

        await lottery.sendTransaction({from: role.participant1, value: finney(10), gasPrice: 0});
        await lottery.sendTransaction({from: role.participant2, value: finney(10), gasPrice: 0});

        await lottery.setCurrentTime(roundId + ROUND_TIME + 1);

        await lottery.sendTransaction({from: role.participant1, value: finney(10), gasPrice: 0});
        await lottery.sendTransaction({from: role.participant3, value: finney(10), gasPrice: 0});

        await lottery.setCurrentTime(roundId + ROUND_TIME + ROUND_PROCESS_TIME + 2);


        await lottery.checkLastRoundsProcessed(5);

        await lottery.setRefundStateToRound(roundId + ROUND_TIME, {from: role.owner1});
        await lottery.setRefundStateToRound(roundId + ROUND_TIME, {from: role.owner2});


        assert.equal2(
            4,//refund
            (await lottery.getRoundInfo(roundId))[0]
        );
        assert.equal2(
            4,//refund
            (await lottery.getRoundInfo(roundId+ROUND_TIME))[0]
        );


        let initBalances = await getInitialBalances();
        let expectedResultBalance = {
            participant1: initBalances.participant1.add(finney(20*STAYED_ON_LOTTERY)),
            participant2: initBalances.participant2.add(finney(10*STAYED_ON_LOTTERY)),
            participant3: initBalances.participant3.add(finney(10*STAYED_ON_LOTTERY)),
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


    });




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

    const finney = num => web3.toWei(num, 'finney');
    const szabo = num => web3.toWei(num, 'szabo');

});

