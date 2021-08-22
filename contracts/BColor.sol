// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity 0.5.12;

// 合约中有用于数据持久化的状态变量，和可以修改状态变量的函数。 
// 调用另一个合约实例的函数时，会执行一个 EVM 函数调用，这个操作会切换执行时的上下文，这样，前一个合约的状态变量就不能访问了。
// external 和 public 类似 只不过函数只能在合约之外调用

// view和constant等价 表示一个函数不能修改状态 本地执行不消耗gas
// 可以将函数声明为 view 类型，这种情况下要保证不修改状态。
// 下面的语句被认为是修改状态：
// 修改状态变量。
// 产生事件。
// 创建其它合约。
// 使用 selfdestruct。
// 通过调用发送以太币。
// 调用任何没有标记为 view 或者 pure 的函数。
// 使用低级调用。
// 使用包含特定操作码的内联汇编。

contract BColor {
// uint 和 bytes32
    function getColor() external view returns (bytes32);
}

contract BBronze is BColor {
    function getColor() external view returns (bytes32) {
        return bytes32("BRONZE");
    }
}
