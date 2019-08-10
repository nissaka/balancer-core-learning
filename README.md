```
git submodule update --init --recursive
npm install

make # builds the contracts
npm test
```

terminology
```
tin: token in
tout: token out
tinBalance:  total amount of token in a pol
tinAmount: amount of tokens in for a particular operation
tinWeight: weight of token in pool
// similar for tout

Pool:
    // swap specify-IN nolimit-out
    swapI(tinAmount, tin, tout) returns (toutAmount)

    // swap nolimit-in specify-OUT
    swapO(tin, tout, toutAmount) returns (tinAmount)

    // swap specify-IN, limit-out
    swapSILO(tinAmount, tin, toutAmount, tout) returns (toutAmount)

    // swap limit-in, specify-OUT
    swapLISO(tin, tinLimit, tout, toutAmount) returns (tinAmount)

Math:
    swapImath( tinBalance, tinWeight,
             , toutBalance, toutWeight,
             , feeRatio
             , tinAmount )
        public pure
        returns ( toutAmount, feeCollected );
```

Math
```
OAmount = OBalance * (1 - ((IBalance / (IBalance + IAmount))**(IWeight/OWeight)))

=>

IBalanceAfter = IBalance + IAmount;
IBalanceRatio = IBalance / (IBalance + IAmount)
Exponent = IWeight / OWeight;
IBalanceScale = IBalanceRatio**Exponent
OBalanceScale = 1 - IBalanceScale
OAmount = OBalance * OBalanceScale


```



