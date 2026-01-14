# MiniSwap - 测试执行指南

本文档提供完整的测试流程和报告模板。

## 测试环境要求

- Node.js v18+
- npm v9+
- Solidity ^0.8.19
- Hardhat ^2.17.0
- Ethers.js ^6.7.1

## 测试执行步骤

### 1. 环境准备

```bash
# 进入智能合约目录
cd smart-contracts

# 安装依赖
npm install

# 验证安装
npm list hardhat chai ethers
```

### 2. 编译智能合约

```bash
npx hardhat compile
```

输出应显示：
```
Compiling 2 Solidity files
✓ Compilation successful
```

### 3. 运行单元测试

```bash
npm test
```

或显示详细输出：
```bash
npm test -- --verbose
```

### 4. 生成测试覆盖率报告

```bash
npx hardhat coverage
```

## 预期的测试结果

### 总体结果
- **总测试数**: 16个
- **预期通过**: 16个
- **通过率**: 100%

### 各模块测试

#### 池创建 (Pool Creation) - 2个测试
- ✓ 应该成功创建池
- ✓ 不应允许重复的池

#### 添加流动性 (Add Liquidity) - 4个测试
- ✓ 应该成功添加流动性
- ✓ 初始流动性的份额计算应正确
- ✓ 应该拒绝零金额
- ✓ 第二个提供者的按比例流动性添加

#### 移除流动性 (Remove Liquidity) - 3个测试
- ✓ 应该成功移除流动性
- ✓ 份额不足时应该拒绝移除
- ✓ 应该返回按比例的金额

#### 交换 (Swap) - 4个测试
- ✓ 应该成功交换代币
- ✓ 应该拒绝零金额交换
- ✓ 应该支持反向交换
- ✓ 应该允许多次交换

#### 边界情况 (Edge Cases) - 2个测试
- ✓ 单个提供者的池应该正确处理
- ✓ removeLiquidity上的重入攻击保护

## 性能基准

### Gas消耗估计

| 操作 | Gas消耗 | ETH成本 (基于100 Gwei) |
|------|--------|----------------------|
| createPool | ~65,000 | 0.0065 ETH |
| addLiquidity (初始) | ~145,000 | 0.0145 ETH |
| addLiquidity (后续) | ~120,000 | 0.012 ETH |
| removeLiquidity | ~65,000 | 0.0065 ETH |
| swap | ~75,000 | 0.0075 ETH |

### 交易确认时间 (本地Hardhat)
- 平均: 1-2秒
- 最快: <1秒
- 无挂起交易

## 本地部署测试

### 1. 启动Hardhat节点

```bash
npx hardhat node
```

输出示例：
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
0x70997970C51812e339D9B73b0245ad59E7dd11f9 (10000 ETH)
...
```

### 2. 在新终端部署合约

```bash
npx hardhat run scripts/deploy.js --network localhost
```

预期输出：
```
开始部署MiniSwap和测试Token...
✓ MiniSwap部署到: 0x5FbDB2315678afccb333f8a9c960e0773A0EfaCa
✓ Token A部署到: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✓ Token B部署到: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
✓ Token C部署到: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
✓ 创建Token A-Token B交易对
✓ 创建Token B-Token C交易对

========== 部署完成 ==========
{
  "network": "localhost",
  "miniswap": "0x5FbDB2315678afccb333f8a9c960e0773A0EfaCa",
  ...
}

部署信息已保存到 deployment.json
```

### 3. 验证前端集成

```bash
cd ../frontend
npm start
```

检查点：
- [ ] 页面在 http://localhost:3000 成功加载
- [ ] MetaMask连接按钮可见
- [ ] 连接钱包后显示账户地址
- [ ] 交换和流动性标签可点击
- [ ] 表单可以输入数据

## 手动测试场景

### 场景1: 基础交换流程
1. 启动Hardhat节点和部署合约
2. 启动前端应用
3. 连接MetaMask到本地网络
4. 导入账户1（有100个Token A）
5. 添加流动性：100 Token A + 100 Token B
6. 交换：10 Token A -> 10 Token B
7. 验证：Token B余额增加10

### 场景2: 流动性提供
1. 账户1添加流动性：100 Token A + 100 Token B
2. 导入账户2
3. 账户2添加流动性：50 Token A + 50 Token B
4. 账户1移除50%的流动性
5. 验证账户1收到约50个Token A和Token B

### 场景3: 多交易对
1. 创建Token B-Token C交易对
2. 在B-C交易对中添加流动性
3. 从A-B交换到A
4. 从B-C交换到C
5. 验证所有余额正确

## 测试报告模板

```
# MiniSwap 智能合约测试报告

## 执行信息
- **测试日期**: YYYY-MM-DD
- **执行人**: [姓名]
- **环境**: Hardhat v2.17.0
- **Solidity版本**: ^0.8.19

## 测试结果汇总
- **总体状态**: ✓ PASSED
- **测试用例**: 16/16 通过
- **通过率**: 100%
- **失败数**: 0
- **跳过数**: 0

## 各模块详细结果

### 智能合约编译
- ✓ MiniSwap.sol - 通过
- ✓ Token.sol - 通过
- 警告: 无

### 单元测试结果
[复制npm test的输出]

### Gas分析
[复制hardhat coverage的关键指标]

## 性能指标
- 平均Gas消耗: 92,500
- 最大Gas消耗: 145,000 (addLiquidity初始)
- 最小Gas消耗: 65,000 (createPool)

## 前端功能验证
- ✓ MetaMask连接
- ✓ 钱包地址显示
- ✓ 交换界面加载
- ✓ 流动性管理界面加载
- ✓ 余额显示
- ✓ 表单验证

## 发现的问题
1. [如有问题，记录在此]
2. [包括影响、严重程度和解决方案]

## 建议和改进
1. [任何建议]
2. [优化建议]

## 签名
- 测试人员: __________________ 日期: __________
- 审核人员: __________________ 日期: __________
```

## 常见错误和解决方案

### 编译错误
```
Error: A file to compile has not been provided.
```
**解决**: 确保contracts/目录存在且包含Solidity文件

### 部署失败
```
Error: Contract address 0x... not deployed
```
**解决**: 确保Hardhat节点正在运行，检查节点日志

### 测试超时
```
Error: Timeout of 40000ms exceeded
```
**解决**: 增加超时时间在hardhat.config.js中

### Gas不足
```
Error: Insufficient funds for gas
```
**解决**: 部署到新的Hardhat实例或增加账户ETH

## 持续集成建议

### 自动化测试脚本
```bash
#!/bin/bash
cd smart-contracts
npm install
npx hardhat compile
npm test
```

### CI/CD配置 (GitHub Actions示例)
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd smart-contracts && npm install
      - run: npx hardhat test
```

## 提交检查清单

在提交前验证：
- [ ] 所有测试通过
- [ ] 编译没有警告
- [ ] Gas使用在预期范围内
- [ ] 前端集成测试通过
- [ ] 代码注释完整
- [ ] README已更新

---

**测试完成后，请将此报告与代码一起提交到GitHub。**
