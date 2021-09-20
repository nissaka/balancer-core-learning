# Solana 学习

## 账户

### 私钥

和助记词相关

### 公钥

可以展示给别人看 也是合约的地址 在 Solana 上只能合约一般被称为 Onchain Program 所以公钥也被称为 programId

### 交易签名

当交易存在相应的数字签名时，表示该账户的私钥持有人已签名并授权了该交易

## 交易 Transaction

Transaction 是由客户端向 Solana 节点发起请求的单元 一个 Transaction 可能包含多个 Instruction

Solana 节点在收到一个客户端发起的 Transaction 后 会先解析里面的每个 Instruction

然后根据 Instruction 里面的 programId 字段 来调用对应的智能合约 并将 Instruction 传递给该智能合约

```javascript
export class Transaction{
    signatures: Array<SignaturePubkeyPair>;
    signature?: Buffer;
    // Transaction 包含多个 instructions
    instructions: Array<TransactionInstruction>;
    recentBlockhash?: Blockhash;
    nonceInfo?: NonceInformation;
    feePayer: PublicKey | null;

    constructor(opts?: TransactionCtorFields);
}

export class TransactionInstruction{
    keys: Array<AccountMeta>;
    programId: PublicKey;
    data: Buffer;

    constructor(opts?: TransactionInstructionCtorFields);
}
```

## 指令 Instruction

Instruction 是智能合约处理的基本单元

整体流程是 DApp 客户端将自定义的指令数据序列化至`data`里面

然后将该帐号信息和`data`发到链上

Solana 节点为其找到要执行的程序 并将该帐号信息和数据`data`传递给合约程序

合约程序中 将`data`数据反序列化 得到客户端传递的具体参数

## Solana/web3.js 介绍

### 1. 创建 Account 账户

Account 类定义

```javascript
export class Account{
    constructor(secreKey?: Buffer | Uint8Array | Array<number>);
    publicKey: PublicKey;
    secretKey: Buffer;
}
```

创建一个 account

```javascript
import { Account } from "@solana/web3.js";

// secretKey 私钥（可传可不传,不传的话会默认生成一个私钥）
const myAccount = new Account(secretKey);
```

### 2. 发送交易 sendTransaction

Transaction 接口定义

```javascript
export class Transaction{
    signatures: Array<SignaturePubkeyPair>;
    signature?: Buffer;
    instructions: Array<TransactionInstruction>;
    recentBlockhash?: Blockhash;
    nonceInfo?: NonceInformation;
    feePayer?: PublicKey;

    constructor(ops?: TransactionCtorFields);
}

export type SignaturePubkeyPair={
    signature?: Buffer;
    publocKey: PublicKey;
}
```

sendTransaction 方法

```javascript
/**
* Sign and send a transaction
*/
async sendTransaction(
    transaction: Transaction,
    signers: Array<Account>,
    options?: SendOptions,
): Promise<TransactionSignature>{
    if(transaction.nonceInfo){
        transaction.sign(...signers);
    }else{
        // data and signature 过程
        // 判断blockhashInfo中是否有该签名
    }
    const wireTransaction=transaction.serialize();
    return await this.sendRawTransaction(wireTransaction, options);
}
/**
* Transaction signature as base-58 encoded string
*/
export type TransactionSignature = string;
```

### 3. 确认交易

交易发送完成后，我们拿到了 TransactionSignature 结果，进行确认

60s（或 30s）没结果，我们可以再次确认，也可以手动在 Solana Explorer 浏览器(explorer.solana.com)上确认

```javascript
/**
 * Confirm the Transaction identified by the specified signature
 */
async confirmTransaction(
    signature: TransactionSignature,
    commitment:? Commitment,
): Promise<RpcResponseAndContext<SignatureResult>>{
    let decodedSignature;
    try{
        decodedSignature = bs58.decode(signature);
    }catch(err){
        throw new Error('signature must be base58 encoded: ' + signature)
    }

    assert(decodedSignature.length === 64, 'signature has invalid length');

    const start=Date.now();
    const subscriptionCommitment = commitment || this.commitment;

    let subscriptionId;
    let response: RpcResponseAndContext<SignatureResult> | null = null;
    const confirmPromise = new Promise((resolve, reject)=>{
        try{
            // 订阅签名更新
            // Register a callback to be invoked upon signature updates
            subscriptionId = this.onSignature(
                signature,
                (result, context)=>{
                    subscriptionId = undefined;
                    response={
                        context,
                        calue: result,
                    };
                    resolve();
                },
                subscriptionCommitment,
            );
        }catch(err){
            reject(err);
        }
    });

    let timeoutMs = 60 * 1000;
    switch(subscriptionCommitment){
        case 'recent':
            break;
        case 'single':
            break;
        case 'singleGossip':
            timeoutMs = 30 * 1000;
            break;
        case 'max':
            break;
        case 'root':
            break;
        // 等等
    }

    try{
        await promiseTimeout(confirmPromise, timeoutMs);
    }finally{
        if(subscriptionId){
            this.removeSignatureListener(subscriptionId);
        }
    }

    if(response === null){
        const duration = (Date.now() = start) / 1000;
        throw new Error(
            `Transaction was nor confirmed in ${duration.toFixed(2,)} seconds. It is unknown if it succeeded or failed. Check signature ${signature} using the Solana Explorer or CLI tools.`,
        );
    }

    return response;
}
```

#### 事实上 solana/web3 中 对 send 和 confirm 进行了封装 使用 sendAndConfirmTransaction 方法即可

### 4. Solana CLI (https://docs.solana.com/zh/cli/conventions)

创建账户后 使用 airdrop 空投 获取一定的资金进行转账

## 集成至 Dapp

网页安装对应的钱包插件（以 solong 举例）

控制台输入`window.solong`可以看到对应的方法

比较重要的是`selectAccount signTransaction transfer`这三个方法

### 1. 检测 SolongExtension 是否存在

```javascript
if (!window.solong) {
  // 可以放一个 solong wallet extension install url 给用户跳转安装
}
```

### 2. 选择账户

假如你有多个帐号 呢么`selectAccount`选择的是当前帐号

如果再次选择 则直接回打印选择过的帐号 没有选择过 则弹出选择弹窗

```javascript
solong.selectAccount().then((account) => {
  console.log("connect account with ", account);
});
```

### 3. 转账

solong wallet 提供了 transfer 转账接口

```javascript
solong.transfer(toAddress, 0.1).then((err) => {
  if (!err) {
    console.log("transfer error:", err);
  } else {
    console.log("transfer success");
  }
});
```

实际上用的是上文提到的 account 转账接口

```javascript
account.transfer(to, amount);
```

### 4. 交易签名

接口

```javascript
async signTransaction(transaction: any): Promise<null | Transaction>
```

调用

```javascript
solong.signTransaction(transaction);
```

签名是需要用到私钥,因为钱包托管了私钥，这里 solong wallet 提供签名接口对 Transaction 进行签名
