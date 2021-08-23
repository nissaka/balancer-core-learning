# asset-manager-utils

```
aave文件夹下基本都是interface
RebalancingRelayer.sol => rebalance相关
RewardsAssetManager.sol => 单个池中的RewardsAssetManager分配奖励
AaveATokenAssetManager.sol => 初始化池子 声明奖励等 balanceof方法调用
IAssetManager.sol => 获取赤字中的balance 是否需要rebalance等
```

# balancer-js

详见README

```
pool-stable => 进行编码的各种方法
pool-utils => 获取池子中的地址，id，声明等
pool-weighted => 包含进行编码的文件 标准化权重的文件
utils => 签名，许可，报错，资产帮助等文件
```

# distributors

```
经销商相关
Exiter.sol => 离开池子相关
MerkleRedeem.sol => 赎回 声明 验证声明
MultiRewards.sol => 多重奖励 相关回调 离开操作 stake相关 _balances()方法
Reinvestor.sol => 重新投资 加入池子，初始化等

```

# deployments

* [`v2-deployments`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/deployments)：所有 Balancer V2 部署合约的地址和 ABI，用于主网和各种测试网络。

  详见README

```
index.ts => getBalancerContract();
task.ts => 各种get set以及 deploy save delete 方法
```

# pool-linear

```
contracts => LinearMath.sol
计算 MainOutPerBptIn BptInPerMainOut 之类
```

# pool-stable

```
math相关
```

# pool-utils

- [`v2-pool-utils`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/pool-utils)：用于开发矿池合约的 Solidity 实用程序。

  详见README

```
BasePool.sol 
BaseGeneralPool.sol
BaseMinimalSwapInfoPool.sol
RelayedBasePool.sol
池子相关 初始化 对池子的操作等
```

# pool-weighted

- [`v2-pool-weighted`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/pool-weighted):[`WeightedPool`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/pool-weighted/contracts/WeightedPool.sol)和[`WeightedPool2Tokens`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/pool-weighted/contracts/WeightedPool2Tokens.sol)合同，以及他们相关的工厂。

  详见README

```
WeightedMath.sol => math相关
BaseWeightedPool.sol => 基础权重池
WeightedPool2Tokens.sol => get set swap等操作
```

# solidity-utils

- [`v2-solidity-utils`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/solidity-utils)：在许多不同合约中使用的杂项 Solidity 助手和实用程序。
- 包`openzeppelin`目录中的所有文件[`v2-solidity-utils`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/solidity-utils)都基于[OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)库
- 包中的`LogExpMath`合同[`v2-solidity-utils`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/solidity-utils)是根据 MIT 许可证获得许可的。

```
math => 该文件夹包含简单的计算
misc => 指向 openzeppelin下的IERC20.sol
openzeppelin => 多种协议 包含ERC20.sol等
```

# standalone-utils

- [`v2-standalone-utils`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/standalone-utils)：杂项独立公用事业合同。

```
BalancerHeloers.sol => _validateAssetAndGetBalances 获取的是池子的balance
LidoRelauer.sol => 加入 离开池子 batchSwap等
```

# typechain

```
abi下WETH参数
```

# vault

* [`Vault`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/vault/contracts/Vault.sol)合约和所有核心接口，包括[`IVault`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/vault/contracts/interfaces/IVault.sol)和池接口：[`IBasePool`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/vault/contracts/interfaces/IBasePool.sol)，[`IGeneralPool`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/vault/contracts/interfaces/IGeneralPool.sol)和[`IMinimalSwapInfoPool`](https://github.com/nissaka/balancer-core-learning/blob/balancer-v2-monorepo/pkg/vault/contracts/interfaces/IMinimalSwapInfoPool.sol)。

* 详见README

```
Vault.sol => 该合约是V2的核心合约
UserBalance.sol => 操作用户余额 存入或撤出时用户地址可以作为token的源 这种内部的balance可以减少gas费用（相比ERC20）_internalTokenBalance
PoolBalances.sol => 对于池中余额的管理
FlashLoans.sol => 快速借贷相关

balances文件夹下
BalanceAllocation.sol => 创建一个数据结构 代表池子的代笔余额 查询，解码等
GenetalPoolsBalance.sol => 常规专业的池数据设置
MinimalSwapInfoPoolsBalance.sol => 在池中的数据进行最小信息交换的专业设置
TwoTokenPoolsBalance.sol => 池中的数据（两个token）的专业设置
```

# Math相关

https://docs.balancer.fi/v/v1/core-concepts/protocol/index