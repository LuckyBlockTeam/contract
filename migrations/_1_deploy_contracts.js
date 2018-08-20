'use strict';

//truffle migrate --reset --network rinkeby
const _owners = [
    '',
    '',
    ''
];

const funds = '';



module.exports = function(deployer, network) {

    const RNG = artifacts.require("RNG.sol");
    let Lottery, DayLottery, WeekLottery, MonthLottery, YearLottery, CappedLottery;

    if (network === "mainnet") {
        Lottery = artifacts.require("Lottery.sol");
        DayLottery = artifacts.require("DayLottery.sol");
        WeekLottery = artifacts.require("WeekLottery.sol");
        MonthLottery = artifacts.require("MonthLottery.sol");
        YearLottery = artifacts.require("YearLottery.sol");
        CappedLottery = artifacts.require("CappedLottery.sol");
    } else {
        Lottery = artifacts.require("TestnetLottery.sol");
        DayLottery = artifacts.require("TestnetDayLottery.sol");
        WeekLottery = artifacts.require("TestnetWeekLottery.sol");
        MonthLottery = artifacts.require("TestnetMonthLottery.sol");
        YearLottery = artifacts.require("TestnetYearLottery.sol");
        CappedLottery = artifacts.require("TestnetCappedLottery.sol");
    }


    let _rng, _day, _week, _month, _year, _capped, _main;

    deployer.then(function() {
        return RNG.new(_owners);
    }).then(function(instance) {
        _rng = instance;

        console.log('rng ok: ' + _rng.address);

        return DayLottery.new(_owners, funds, _rng.address, {from:_owners[0]});
    }).then(function(instance) {
        _day = instance;

        console.log('day ok: ' + _day.address);

        return WeekLottery.new(_owners, funds, _rng.address, {from:_owners[0]});
    }).then(function(instance) {
        _week = instance;

        console.log('week ok: ' + _week.address);

        return MonthLottery.new(_owners, funds, _rng.address, {from:_owners[0]});
    }).then(function(instance) {
        _month = instance;

        console.log('month ok: ' + _month.address);

        return YearLottery.new(_owners, funds, _rng.address, {from:_owners[0]});
    }).then(function(instance) {
        _year = instance;

        console.log('year ok: ' + _year.address);

        return CappedLottery.new(_owners, funds, _rng.address, {from:_owners[0]});
    }).then(function(instance) {
        _capped = instance;

        console.log('capped ok: ' + _capped.address);

        return Lottery.new(_owners, funds, _rng.address, _day.address, _week.address, _month.address, _year.address, _capped.address, {from:_owners[0]});
    }).then(function(instance) {
        _main = instance;

        console.log('main ok: ' + _main.address);

        return _rng.setLotteries([_main.address, _day.address, _week.address, _month.address, _year.address, _capped.address], {from:_owners[0]});
    }).then(function(instance) {
        console.log('set lotteries to rng ok (1/2)');

        return _rng.setLotteries([_main.address, _day.address, _week.address, _month.address, _year.address, _capped.address], {from:_owners[1]});
    }).then(function(instance) {
        console.log('set lotteries to rng ok (2/2)');

        return _day.setMainLottery(_main.address, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set main lottery day ok (1/2)');

        return _day.setMainLottery(_main.address, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set main lottery day ok (2/2)');

        return _week.setMainLottery(_main.address, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set main lottery week ok (1/2)');

        return _week.setMainLottery(_main.address, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set main lottery week ok (2/2)');

        return _month.setMainLottery(_main.address, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set main lottery month ok (1/2)');

        return _month.setMainLottery(_main.address, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set main lottery month ok (2/2)');

        return _year.setMainLottery(_main.address, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set main lottery year ok (1/2)');

        return _year.setMainLottery(_main.address, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set main lottery year ok (2/2)');

        return _capped.setMainLottery(_main.address, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set main lottery capped ok (1/2)');

        return _capped.setMainLottery(_main.address, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set main lottery capped ok (2/2)');


        return _rng.setCallbackGasPrice(20*10**9, {from:_owners[0]});
    }).then(function(instance) {
        console.log('set rng gas price ok (1/2)');

        return _rng.setCallbackGasPrice(20*10**9, {from:_owners[1]});
    }).then(function(instance) {
        console.log('set rng gas price ok (2/2)');

    })
};