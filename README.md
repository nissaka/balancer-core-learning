# Raydium 获取价格与swap使用
## 说明
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
yarn build
```