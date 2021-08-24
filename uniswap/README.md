# Original
https://github.com/a04512/Front-RunBot.git
# Install 
```
cd /uniswap
yarn
```
# Running
env.js中增加private key后
node frontrun.js

# Diagram

1. 创建Web3对象 进行eth交易的库，并测试是否能建立连接

2. 准备攻击

   1）设置机器人

   * 获取设置的地址的余额，地址等信息 余额大于10E17时，执行合约，参数为（botABI, FRONT_BOT_ADDRESS）详见bot.js

   * 执行合约方法countFrontBots()，统计创建的机器人个数，运行合约方法getFrontBotAddr()，遍历地址，当地址不等于private key对应的地址时才进行下一步

   * 执行合约方法setFrontBot，得到encodedABI,并加入tx中，签名后上链

   * tx参数：

     ```json
     from 机器人地址
     to bot.js中设置的地址
     gas 500000
     gasPrice 150*10**9
     data encodeABI
     ```

   2）打印用户钱包地址的ETH信息
   
   3）获取对应token（env.js中设置的TOKEN_ADDRESS）的信息 **out_token_info**
   
   4）获取当前gas价格(最高gas，最低gas等)
   
3. 更新池信息

   *  input volumn=eth balance
   * output volumn=token balance
   * attackk volumn=the_balance*(attack_level/100)
   * attack_level就是env.js中设置的LEVEL

4. 调用uniswap abi方法getAmountOut获取**outputtoken**

5. 运行approve(最高gas价格, outputtoken, env.js中设置的token_address, private_key对应的钱包地址)

   * 调用allowance()方法获取allowance

   * current allowance= allowance/10**out_token_info.decimals

   * min_allowance=100 * 10 ** out_token_info.decimals;

   * max_allowance=100 * 10 ** out_token_info.decimals;

   * if outputtoken>max_allowance then max_allowance=outputtoken

   * 当allowance<=min_allowance时 发起交易approveTX上链

   * ```json
     from 用户地址
     to bot.js中设置的地址
     gas 50000
     gasPrice 最高gas*1e9
     data out_token_info.token_contract.methods
                     .approve(UNISWAP_ROUTER_ADDRESS, max_allowance)
                     .encodeABI()
     ```

6. 追踪交易后的 池信息（attack_volumn）并打印

7. 订阅 开始准备待定交易

   1）调用eth方法subscribe

   2） 当满足pendingTransactions条件时 触发事件

   3）获取交易hash值

   4）如果hash不为空 同时to的地址为我们env中设置的UNISWAP_ROUTER_ADDRESS地址时 接管交易方法启动

   5）接管交易

   * 停止订阅

   * gasPrice等于订阅交易的gasPrice+50*1e9

     estimatedInput = (amount * 0.999 * 10 ** 18).toString();

     realInput = (amount * 10 ** 18).toString();

     gasLimit = (300000).toString();

   * 更新池信息

   * 获取**outputtoken**

   * 运行swap方法

     * 计算deadline ，比最近的链+5分钟

     * ```javascript
       买的情况
       		swap = uniswapRouter.methods.swapETHForExactTokens(
                   outputtoken.toString(),
                   [INPUT_TOKEN_ADDRESS, out_token_address],
                   from.address,
                   deadline
               );
                      var encodedABI = swap.encodeABI();
       
               var tx = {
                   from: from.address,
                   to: UNISWAP_ROUTER_ADDRESS,
                   gas: gasLimit,
                   gasPrice: gasPrice,
                   data: encodedABI,
                   value: outputeth,
               };
       ```

     * ```javascript
       卖的情况
       		outputeth = outputeth * 0.999;
       
               swap = uniswapRouter.methods.swapExactTokensForETH(
                   outputtoken.toString(),
                   outputeth.toString(),
                   [out_token_address, INPUT_TOKEN_ADDRESS],
                   from.address,
                   deadline
               );
               var encodedABI = swap.encodeABI();
       
               var tx = {
                   from: from.address,
                   to: UNISWAP_ROUTER_ADDRESS,
                   gas: gasLimit,
                   gasPrice: gasPrice,
                   data: encodedABI,
                   value: 0 * 10 ** 18,
               };
       ```

     * 如果时买的情况 此时还要检测需要阻止的交易是否已经成功了 来判断是否继续交易

     * 上链

     * **其实无论买卖 就是交易费增加 对应的amount*0.999**

