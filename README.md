# Raydium 获取价格与swap使用
## 说明
不太清楚py调node是怎么传参数的 暂时把私钥写死在全局参数里
### 获取价格 python实现
python文件夹下

实现方式: 调取对应api即可

或者```/src/utils```下有api文件使用ts实现
### swap
精简raydium-ui项目中的代码
主要分为 wrap, swap, place三种情况
* wrap 主要用于池已经初始化的情况
* swap 主要用于Raydium Pool对应的AMMId的情况
* place 主要用于以上两种情况之外的情况

## 使用
### 获取价格
直接使用python文件夹下的py文件
### swap
```
yarn install
```
index.ts 文件中 列举了运行swap时需要的参数

## wallet解决方案
@solana/web3.js/src/connection.ts/ 中有sendTransaction方法
https://docs.solana.com/zh/developing/clients/jsonrpc-api#sendtransaction

# 关于网页版和服务端
1. wallet自带sendTransaction与@solana/web3.js中的sendAndConifrmTransaction
2. import和require
3. 网页端可以自行选择金额和对象，服务端需要列出相关信息
 * getPrice
 * getPairs
 * getToken
 * getPool
 * swap