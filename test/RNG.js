'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf = require('./_helpers/balanceOf');
const RNG = artifacts.require('RNGHelper.sol');
const SecondLevelLotteryMock = artifacts.require('SecondLevelLotteryMock.sol');

assert.equal2 = require('./_helpers/equal2');

contract('RNG', function(accounts) {

    const role = {
        owner1: accounts[0],
        owner2: accounts[1],
        owner3: accounts[2],
        addr1: accounts[3],
        addr2: accounts[4],
        addr3: accounts[5],
        addr4: accounts[6],
        addr5: accounts[7],
        addr6: accounts[2],

        nobody: accounts[8],
        oraclize: accounts[9],
    };

    let rng, lot1, lotAttacker;

    beforeEach(async function() {
        rng = await RNG.new([role.owner1, role.owner2, role.owner3], {from: role.nobody});
        lot1 = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, rng.address);
        lotAttacker = await SecondLevelLotteryMock.new([role.owner1, role.owner2, role.owner3], 1, rng.address);

        await rng.setLotteries([lot1.address, 1, 2, 3, 4, 5], {from: role.owner1});
        await rng.setLotteries([lot1.address, 1, 2, 3, 4, 5], {from: role.owner2});

        await rng.sendTransaction({from: role.nobody, value: web3.toWei(1, 'ether')});

    });


    it("Test withdraw", async function() {
        let initialBalance = await balanceOf(rng.address);

        await rng.sendTransaction({from: role.nobody, value: web3.toWei(10, 'finney')});
        assert.equal2(initialBalance.add(web3.toWei(10, 'finney')), await balanceOf(rng.address));

        let nobodyBalance = await balanceOf(role.nobody);
        await rng.withdraw(role.nobody, web3.toWei(5, 'finney'), {from: role.owner1});
        assert.equal2(initialBalance.add(web3.toWei(10, 'finney')), await balanceOf(rng.address));
        await rng.withdraw(role.nobody, web3.toWei(5, 'finney'), {from: role.owner2});
        assert.equal2(initialBalance.add(web3.toWei(5, 'finney')), await balanceOf(rng.address));
        assert.equal2(nobodyBalance.add(web3.toWei(5, 'finney')), await balanceOf(role.nobody));
    });

    it("Test get random", async function() {
        assert.equal2(0, await lot1.processRound_roundId());
        await expectThrow(lot1.processRound_randomNumbers(0));

        await lot1.__callGetRandom(1, 10);

        await rng.__callCallback({from: role.oraclize});
        assert.equal2(1, await lot1.processRound_roundId());
        assert(10 > await lot1.processRound_randomNumbers(0).valueOf());
        assert(10 > await lot1.processRound_randomNumbers(9).valueOf());
        await expectThrow(lot1.processRound_randomNumbers(10));

    });

    it("Test get random fails from not set lottery", async function() {

        await expectThrow(lotAttacker.__callGetRandom(1, 10));
        await lot1.__callGetRandom(1, 10);
        await expectThrow(lotAttacker.__callGetRandom(1, 10));
    });

    it("Test set lotteries", async function() {
        //replace beforeEach
        rng = await RNG.new([role.owner1, role.owner2, role.owner3], {from: role.nobody});

        await             rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5], {from: role.owner2}));

        await             rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, 0], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, 0], {from: role.owner2}));

        await             rng.setLotteries([role.addr1, role.addr2, role.addr3, 0, role.addr5, role.addr6], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, role.addr3, 0, role.addr5, role.addr6], {from: role.owner2}));

        await             rng.setLotteries([role.addr1, role.addr2, 0, role.addr4, role.addr5, role.addr6], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, 0, role.addr4, role.addr5, role.addr6], {from: role.owner2}));

        await             rng.setLotteries([role.addr1, 0, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, 0, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner2}));

        await             rng.setLotteries([0, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner1});
        await expectThrow(rng.setLotteries([0, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner2}));

        //duplicates
        await             rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr1], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr1], {from: role.owner2}));

        //not set
        await expectThrow(rng.m_lotteriesList(0));

        await rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner1});
        await rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner2});


        assert.equal2(role.addr1, await rng.m_lotteriesList.call(0));
        assert.equal2(role.addr2, await rng.m_lotteriesList.call(1));
        assert.equal2(role.addr3, await rng.m_lotteriesList.call(2));
        assert.equal2(role.addr4, await rng.m_lotteriesList.call(3));
        assert.equal2(role.addr5, await rng.m_lotteriesList.call(4));
        assert.equal2(role.addr6, await rng.m_lotteriesList.call(5));

        //one time only
        await             rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner1});
        await expectThrow(rng.setLotteries([role.addr1, role.addr2, role.addr3, role.addr4, role.addr5, role.addr6], {from: role.owner2}));

    });

});