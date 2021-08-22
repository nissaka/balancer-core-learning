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

import "./BNum.sol";

// Highly opinionated token implementation

interface IERC20 {
    // 事件是智能合约发出的信号。智能合约的前端UI
    // 例如，DApps、web.js，或者任何与Ethereum JSON-RPC API连接的东西，都可以侦听这些事件。事件可以被索引，以便以后可以搜索事件记录。
    event Approval(address indexed src, address indexed dst, uint256 amt);
    event Transfer(address indexed src, address indexed dst, uint256 amt);

    function totalSupply() external view returns (uint256);

    function balanceOf(address whom) external view returns (uint256);

    function allowance(address src, address dst)
        external
        view
        returns (uint256);

    function approve(address dst, uint256 amt) external returns (bool);

    function transfer(address dst, uint256 amt) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 amt
    ) external returns (bool);
}

// internal 和 private 类似，不过， 如果某个合约继承自其父合约，这个合约即可以访问父合约中定义的“内部”函数。
contract BTokenBase is BNum {
    // 映射是一种引用类型，存储键值对。它的定义是：mapping(key => value)，概念上与java中的map，python中的字典类型类似，但在使用上有比较多的限制。
    mapping(address => uint256) internal _balance;
    mapping(address => mapping(address => uint256)) internal _allowance;
    uint256 internal _totalSupply;
    event Approval(address indexed src, address indexed dst, uint256 amt);
    event Transfer(address indexed src, address indexed dst, uint256 amt);

    // ERC20 token标准介绍了一种Transfer事件以及一个transfer()方法。
    // 它们的调用语法不完全相同：
    // transfer(address to, uint value);
    // Transfer(address from, address to, uint256 _value);

    // 但是这种相似足够引起混淆。
    // 对未来的Solidity程序员来说这是一个很严重的问题，必须避免意外地将外部调用函数映射到一个
    // 名字相似的事件上，而这导致了去年的DAO攻击。有人建议在事件名前面加上Log前缀来标识以避免将函数和事件混淆，但是最后还是决定引进一个新的关键字emit。

    // 所以：
    // event Transfer(address from, address to, uint256 _value);
    // // …
    // Transfer(from, to, value);
    // 就变为了：

    // event Transfer(address from, address to, uint256 _value);
    // // …
    // emit Transfer(from, to, value);

    // 这就能够让函数调用和事件日志之间具备了语义上的不同。
    // Transfer事件：
    // 当token被转移的时候必须触发该事件，包括零值转移。
    // 一个创建新token的合约在给_from地址赋0x0值时必须触发一个Transfer事件event Transfer(address indexed _from, address indexed _to, uint256 _value)

    // transfer方法：
    // 转移_value个token到地址_to，必须激活Transfer事件，若_from账户余额token不足，则该函数应该抛出异常。注意零值转移必须和普通转移一样必须激活Transfer事件

    // 简单的讲
    // Emit 关键字用于在solidity 中发出事件，客户端可以在Dapp 中读取该事件。
    // event用于记录区块链中发生的交易。
    function _mint(uint256 amt) internal {
        _balance[address(this)] = badd(_balance[address(this)], amt);
        _totalSupply = badd(_totalSupply, amt);
        emit Transfer(address(0), address(this), amt); // 触发事件
    }

    // assert() 想象为一个过于自信的实现方式，即使有错误，也会执行并扣除gas。
    // 然而 require() 可以被想象为一个更有礼貌些的实现方式，会发现错误，并且原谅所犯错误（译注：不扣除 gas）。
    function _burn(uint256 amt) internal {
        require(_balance[address(this)] >= amt, "ERR_INSUFFICIENT_BAL");
        _balance[address(this)] = bsub(_balance[address(this)], amt);
        _totalSupply = bsub(_totalSupply, amt);
        emit Transfer(address(this), address(0), amt);
    }

    function _move(
        address src,
        address dst,
        uint256 amt
    ) internal {
        require(_balance[src] >= amt, "ERR_INSUFFICIENT_BAL");
        _balance[src] = bsub(_balance[src], amt);
        _balance[dst] = badd(_balance[dst], amt);
        emit Transfer(src, dst, amt);
    }

    function _push(address to, uint256 amt) internal {
        _move(address(this), to, amt);
    }

    function _pull(address from, uint256 amt) internal {
        _move(from, address(this), amt);
    }
}

// private修饰的变量和函数，只能在其所在的合约中调用和访问，即使是其子合约也没有权限访问。
contract BToken is BTokenBase, IERC20 {
    string private _name = "Balancer Pool Token";
    string private _symbol = "BPT";
    uint8 private _decimals = 18;

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function allowance(address src, address dst)
        external
        view
        returns (uint256)
    {
        return _allowance[src][dst];
    }

    function balanceOf(address whom) external view returns (uint256) {
        return _balance[whom];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function approve(address dst, uint256 amt) external returns (bool) {
        _allowance[msg.sender][dst] = amt;
        emit Approval(msg.sender, dst, amt);
        return true;
    }

    function increaseApproval(address dst, uint256 amt)
        external
        returns (bool)
    {
        _allowance[msg.sender][dst] = badd(_allowance[msg.sender][dst], amt);
        emit Approval(msg.sender, dst, _allowance[msg.sender][dst]);
        return true;
    }

    function decreaseApproval(address dst, uint256 amt)
        external
        returns (bool)
    {
        uint256 oldValue = _allowance[msg.sender][dst];
        if (amt > oldValue) {
            _allowance[msg.sender][dst] = 0;
        } else {
            _allowance[msg.sender][dst] = bsub(oldValue, amt);
        }
        emit Approval(msg.sender, dst, _allowance[msg.sender][dst]);
        return true;
    }

    function transfer(address dst, uint256 amt) external returns (bool) {
        _move(msg.sender, dst, amt);
        return true;
    }

    function transferFrom(
        address src,
        address dst,
        uint256 amt
    ) external returns (bool) {
        require(
            msg.sender == src || amt <= _allowance[src][msg.sender],
            "ERR_BTOKEN_BAD_CALLER"
        );
        _move(src, dst, amt);
        if (msg.sender != src && _allowance[src][msg.sender] != uint256(-1)) {
            _allowance[src][msg.sender] = bsub(
                _allowance[src][msg.sender],
                amt
            );
            emit Approval(msg.sender, dst, _allowance[src][msg.sender]);
        }
        return true;
    }
}
