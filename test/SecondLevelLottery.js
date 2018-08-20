'use strict';

const expectThrow = require('./_helpers/expectThrow');
const balanceOf   = require('./_helpers/balanceOf');
const SecondLevelLottery = artifacts.require('SecondLevelLotteryHelper.sol');
const Lottery = artifacts.require('LotteryHelper.sol');
const RNG = artifacts.require('RNGHelper.sol');
const Sender = artifacts.require('Sender.sol');

assert.equal2 = require('./_helpers/equal2');

contract('SecondLevelLottery', function(accounts) {

    const role = {
        owner1: accounts[0],
        owner2: accounts[1],
        owner3: accounts[2],
        funds: accounts[3],
        rng: accounts[4],
        addr1: accounts[5],
        addr2: accounts[6]

    };

    it("Test set main lottery", async function() {
        //replace beforeEach
        let lottery = await SecondLevelLottery.new([role.owner1, role.owner2, role.owner3], role.funds, role.rng);

        await             lottery.setMainLottery(0, {from: role.owner1});
        await expectThrow(lottery.setMainLottery(0, {from: role.owner2}));

        assert.equal2(0, await lottery.m_mainLottery.call());

        await lottery.setMainLottery(role.addr1, {from: role.owner1});
        await lottery.setMainLottery(role.addr1, {from: role.owner2});

        assert.equal2(role.addr1, await lottery.m_mainLottery.call());


        //one time only
        await             lottery.setMainLottery(role.addr2, {from: role.owner1});
        await expectThrow(lottery.setMainLottery(role.addr2, {from: role.owner2}));

    });

});


