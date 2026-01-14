// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MiniSwap is ReentrancyGuard {
    // 流动性池结构
    struct LiquidityPool {
        IERC20 tokenA;
        IERC20 tokenB;
        uint256 balanceA;
        uint256 balanceB;
        uint256 totalShares;
        mapping(address => uint256) shares;
    }

    // 存储所有流动性池
    mapping(bytes32 => LiquidityPool) public pools;
    mapping(bytes32 => bool) public poolExists;

    // 事件定义
    event PoolCreated(address indexed tokenA, address indexed tokenB);
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 shares
    );
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // 创建流动性池
    function createPool(IERC20 tokenA, IERC20 tokenB) external {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(!poolExists[poolId], "Pool already exists");

        pools[poolId].tokenA = tokenA;
        pools[poolId].tokenB = tokenB;
        pools[poolId].balanceA = 0;
        pools[poolId].balanceB = 0;
        pools[poolId].totalShares = 0;

        poolExists[poolId] = true;

        emit PoolCreated(address(tokenA), address(tokenB));
    }

    // 添加流动性
    function addLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amountA,
        uint256 amountB
    ) external returns (uint256 shares) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(poolExists[poolId], "Pool does not exist");
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        LiquidityPool storage pool = pools[poolId];

        // 转账代币到合约
        require(
            tokenA.transferFrom(msg.sender, address(this), amountA),
            "TokenA transfer failed"
        );
        require(
            tokenB.transferFrom(msg.sender, address(this), amountB),
            "TokenB transfer failed"
        );

        // 计算LP份额
        if (pool.totalShares == 0) {
            // 初始流动性提供者
            shares = sqrt(amountA * amountB);
        } else {
            // 后续流动性提供者，取较小值
            uint256 sharesA = (amountA * pool.totalShares) / pool.balanceA;
            uint256 sharesB = (amountB * pool.totalShares) / pool.balanceB;
            shares = sharesA < sharesB ? sharesA : sharesB;
        }

        require(shares > 0, "Invalid share calculation");

        // 更新池状态
        pool.balanceA += amountA;
        pool.balanceB += amountB;
        pool.totalShares += shares;
        pool.shares[msg.sender] += shares;

        emit LiquidityAdded(msg.sender, address(tokenA), address(tokenB), amountA, amountB, shares);
    }

    // 移除流动性
    function removeLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 shares
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(poolExists[poolId], "Pool does not exist");
        require(shares > 0, "Shares must be greater than 0");

        LiquidityPool storage pool = pools[poolId];
        require(pool.shares[msg.sender] >= shares, "Insufficient shares");

        // 计算返还的代币数量
        amountA = (shares * pool.balanceA) / pool.totalShares;
        amountB = (shares * pool.balanceB) / pool.totalShares;

        require(amountA > 0 && amountB > 0, "Invalid amounts");

        // 更新池状态
        pool.shares[msg.sender] -= shares;
        pool.totalShares -= shares;
        pool.balanceA -= amountA;
        pool.balanceB -= amountB;

        // 转账代币给用户
        require(tokenA.transfer(msg.sender, amountA), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountB), "TokenB transfer failed");

        emit LiquidityRemoved(msg.sender, address(tokenA), address(tokenB), amountA, amountB, shares);
    }

    // 交换代币
    function swap(
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");

        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        require(poolExists[poolId], "Pool does not exist");

        LiquidityPool storage pool = pools[poolId];

        // 确定输入和输出
        bool isTokenA = address(tokenIn) == address(pool.tokenA);
        require(
            isTokenA || address(tokenIn) == address(pool.tokenB),
            "Invalid token"
        );

        // 转账输入代币
        require(
            tokenIn.transferFrom(msg.sender, address(this), amountIn),
            "Transfer failed"
        );

        // 简化实现：1:1兑换
        amountOut = amountIn;

        // 转账输出代币
        require(
            tokenOut.transfer(msg.sender, amountOut),
            "Output transfer failed"
        );

        emit Swap(msg.sender, address(tokenIn), address(tokenOut), amountIn, amountOut);
    }

    // 获取池ID
    function getPoolId(IERC20 tokenA, IERC20 tokenB)
        internal
        pure
        returns (bytes32)
    {
        if (address(tokenA) < address(tokenB)) {
            return keccak256(abi.encodePacked(tokenA, tokenB));
        }
        return keccak256(abi.encodePacked(tokenB, tokenA));
    }

    // 获取池信息
    function getPoolInfo(IERC20 tokenA, IERC20 tokenB)
        external
        view
        returns (
            uint256 balanceA,
            uint256 balanceB,
            uint256 totalShares
        )
    {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(poolExists[poolId], "Pool does not exist");

        LiquidityPool storage pool = pools[poolId];
        balanceA = pool.balanceA;
        balanceB = pool.balanceB;
        totalShares = pool.totalShares;
    }

    // 获取用户的LP份额
    function getUserShares(
        IERC20 tokenA,
        IERC20 tokenB,
        address user
    ) external view returns (uint256) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        require(poolExists[poolId], "Pool does not exist");

        return pools[poolId].shares[user];
    }

    // 计算平方根（用于初始流动性）
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
