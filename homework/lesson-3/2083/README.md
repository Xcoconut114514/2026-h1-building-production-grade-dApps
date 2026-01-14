# MiniSwap - 简易DEX实现

一个简化的去中心化交换协议实现，包含智能合约和React前端界面。

## 项目结构

```
miniswap/
├── smart-contracts/          # Solidity智能合约
│   ├── contracts/
│   │   ├── Token.sol        # ERC20测试Token
│   │   └── MiniSwap.sol     # 核心交换合约
│   ├── test/
│   │   └── MiniSwap.test.js # 单元测试
│   ├── scripts/
│   │   └── deploy.js        # 部署脚本
│   ├── hardhat.config.js
│   └── package.json
├── frontend/                 # React前端UI
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── contracts/       # ABI文件
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## 功能特性

### 核心功能
- ✅ **添加流动性** (addLiquidity) - 向流动性池注入代币
- ✅ **移除流动性** (removeLiquidity) - 从流动性池提取代币
- ✅ **代币交换** (swap) - 1:1兑换任意代币对

### 合约特性
- 防重入攻击保护 (ReentrancyGuard)
- 完整的事件日志记录
- 池存在性验证
- 份额计算机制

### 前端特性
- MetaMask钱包集成
- 现代化UI设计（渐变色、响应式布局）
- 实时余额显示
- 交易结果反馈
- 流动性管理界面

## 快速开始

### 环境要求
- Node.js v18+
- npm 或 yarn
- MetaMask浏览器扩展
- Hardhat CLI

### 安装依赖

#### 智能合约
```bash
cd smart-contracts
npm install
```

#### 前端
```bash
cd ../frontend
npm install
```

## 本地测试和部署

### 启动本地Hardhat节点
```bash
cd smart-contracts
npx hardhat node
```

节点将在 http://127.0.0.1:8545 启动，ChainID为1337

### 在另一个终端部署合约
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```

部署后会生成 `deployment.json` 文件，包含所有合约地址。

### 运行智能合约测试

```bash
cd smart-contracts
npm test
```

#### 测试覆盖内容
- ✓ 池创建
- ✓ 添加流动性（初始和后续）
- ✓ 移除流动性
- ✓ 代币交换
- ✓ 边界情况和错误处理
- ✓ 防重入攻击

### 启动前端应用
```bash
cd frontend
npm start
```

前端将在 http://localhost:3000 打开

### 在MetaMask中配置本地网络

1. 打开MetaMask钱包
2. 点击网络选择器 → 添加网络
3. 配置以下信息：
   - **网络名称**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **货币符号**: ETH

4. 导入测试账户（Hardhat会在启动时显示私钥）

## 合约部署地址示例

在本地部署时，合约地址将自动生成。示例：

```json
{
  "network": "localhost",
  "miniswap": "0x5FbDB2315678afccb333f8a9c960e0773A0EfaCa",
  "tokenA": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "tokenB": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "tokenC": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
}
```

## 使用流程

### 1. 添加流动性
1. 连接MetaMask钱包
2. 切换到"流动性"标签
3. 输入两种代币的数量（保持1:1比例最佳）
4. 点击"添加流动性"
5. 确认MetaMask交易

### 2. 进行交换
1. 连接钱包后切换到"交换"标签
2. 选择输入代币和输出代币
3. 输入交换数量
4. 点击"确认交换"
5. 确认MetaMask交易

### 3. 移除流动性
1. 在"流动性"标签中切换到"移除流动性"
2. 输入要移除的份额数量
3. 点击"移除流动性"
4. 确认MetaMask交易

## 重要的参数说明

### 交换比例
- 当前实现为 **1:1** 固定比例
- 没有手续费
- 没有流动性提供者奖励

### 份额计算
- **初始流动性**: `shares = sqrt(amountA * amountB)`
- **后续流动性**: `shares = min(amountA/balanceA, amountB/balanceB) * totalShares`
- **提取**: `returnAmount = shares/totalShares * poolBalance`

## 测试报告生成

运行所有测试后，查看输出：

```bash
npm test -- --reporter json > test-report.json
```

## 故障排查

### 合约部署失败
- 确保Hardhat节点正在运行
- 检查网络配置：`npx hardhat networks --show`
- 清除缓存：`rm -rf artifacts/ cache/`

### 交易失败
- 确保钱包有足够的ETH（用于Gas费）
- 检查代币授权是否成功
- 查看浏览器控制台的错误日志

### 前端连接问题
- 确认MetaMask网络配置正确
- 刷新页面重新连接
- 更新 `CONTRACT_ADDRESSES` 中的合约地址

## 高级功能扩展建议

### 已支持功能
- ✅ 多个交易对
- ✅ 动态流动性计算
- ✅ 防重入保护

### 可扩展的功能
- 交易手续费（0.3%等）
- 流动性挖矿奖励
- 价格预言机集成
- 限价单交易
- LP代币
- 闪电贷

## 许可证

MIT License

## 学习资源

- [Uniswap V2文档](https://docs.uniswap.org/contracts/v2/overview)
- [Solidity文档](https://docs.soliditylang.org/)
- [Hardhat文档](https://hardhat.org/docs)
- [Web3.js文档](https://web3js.readthedocs.io/)

## 联系方式

有问题或建议，欢迎提交Issue或PR。

---

**注意**: 这是一个学习项目，不适合在生产环境使用。请务必进行安全审计后再部署到主网。
