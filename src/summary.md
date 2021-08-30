# 总结

该脚本的核心在于寻找最短路径，就像readme中给出的网址https://hackernoon.com/arbitrage-as-a-shortest-path-problem-u2l34ow中提到的算法。

![套利机会](https://hackernoon.com/_next/image?url=https%3A%2F%2Fcdn.hackernoon.com%2Fimages%2FqSHqXd3vvfdEmnPmFdY4JAryq2l2-133544mk.png&w=1920&q=75)

利用balancer的接口 获取池子中的token信息，再获得具体的token信息（主要是balance和weight）

将所有token对应的与其他币的兑换率计算出来，并根据这个，计算出所有兑换路径，以及该路径下的套利机会是否大于1。

该脚本并没有对得到的套利机会rate进行处理。

后续调用了batchswap方法。

# 具体的代码说明

见```/src/index.ts```

## todo

作者再readme中说明

1. 用batch swap 验证 在没有gas费用的情况下 套利的情况
2. 隐藏前面运行的机器人（交易和获利的账户分开，一部分利润给自己，一部分流向其他的前端机器人）

