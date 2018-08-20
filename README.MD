
Deploy order:
- RNG contract
- day lottery (RNG)
- week lottery (RNG)
- month lottery (RNG)
- year lottery (RNG)
- capped lottery (RNG)
- hour lottery (RNG, day, week, month, year, capped)
- set hour, day, week, month, year to RNG (setLotteries)
- set hour lottery to day, week, month, year, capped (setMainLottery)
- !send ether to rng contract



## Tests

terminal#1 `truffle develop --log`
terminal#2 `truffle test`


