import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./SwapInterface.css";
import MINISWAP_ABI from "../contracts/MiniSwap.json";
import TOKEN_ABI from "../contracts/Token.json";

// 本地部署的合约地址（部署后需要更新）
const CONTRACT_ADDRESSES = {
  miniswap: "0x5FbDB2315678afccb333f8a9c960e0773A0EfaCa",
  tokenA: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  tokenB: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

function SwapInterface({ account, signer }) {
  const [tokenIn, setTokenIn] = useState(CONTRACT_ADDRESSES.tokenA);
  const [tokenOut, setTokenOut] = useState(CONTRACT_ADDRESSES.tokenB);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 获取余额
  useEffect(() => {
    if (account && tokenIn) {
      fetchBalance();
    }
  }, [account, tokenIn, signer]);

  const fetchBalance = async () => {
    try {
      const tokenContract = new ethers.Contract(tokenIn, TOKEN_ABI, signer);
      const bal = await tokenContract.balanceOf(account);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error("获取余额失败:", error);
      setBalance("0");
    }
  };

  const handleSwap = async () => {
    setError("");
    setSuccess("");

    if (!amountIn || parseFloat(amountIn) <= 0) {
      setError("请输入有效的交换数量");
      return;
    }

    setLoading(true);
    try {
      const miniswapContract = new ethers.Contract(
        CONTRACT_ADDRESSES.miniswap,
        MINISWAP_ABI,
        signer
      );

      const tokenInContract = new ethers.Contract(
        tokenIn,
        TOKEN_ABI,
        signer
      );

      // 检查授权
      const allowance = await tokenInContract.allowance(
        account,
        CONTRACT_ADDRESSES.miniswap
      );
      const amountInWei = ethers.parseEther(amountIn);

      if (allowance < amountInWei) {
        setError("正在授权...");
        const approveTx = await tokenInContract.approve(
          CONTRACT_ADDRESSES.miniswap,
          ethers.MaxUint256
        );
        await approveTx.wait();
        setSuccess("授权成功！");
      }

      // 执行交换
      setError("正在交换...");
      const tx = await miniswapContract.swap(tokenIn, tokenOut, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccess("✓ 交换成功!");
        setAmountIn("");
        setAmountOut("");
        fetchBalance();
      }
    } catch (error) {
      setError(`交换失败: ${error.message}`);
      console.error("交换错误:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn("");
    setAmountOut("");
  };

  return (
    <div className="swap-interface">
      <h2>💱 代币交换</h2>
      <p className="subtitle">用任何代币兑换另一个代币</p>

      <div className="balance-display">
        余额: <span className="amount">{parseFloat(balance).toFixed(4)}</span>
      </div>

      <div className="swap-form">
        <div className="input-group">
          <label>输出代币</label>
          <div className="input-with-select">
            <input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              disabled={loading}
            />
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              disabled={loading}
            >
              <option value={CONTRACT_ADDRESSES.tokenA}>Token A</option>
              <option value={CONTRACT_ADDRESSES.tokenB}>Token B</option>
              <option value={CONTRACT_ADDRESSES.tokenC}>Token C (如可用)</option>
            </select>
          </div>
        </div>

        <button
          className="btn-switch"
          onClick={switchTokens}
          disabled={loading}
          title="切换代币"
        >
          ⇅
        </button>

        <div className="input-group">
          <label>目标代币</label>
          <div className="input-with-select">
            <input
              type="number"
              placeholder="0.0"
              value={amountOut || amountIn}
              disabled
              readOnly
            />
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              disabled={loading}
            >
              <option value={CONTRACT_ADDRESSES.tokenB}>Token B</option>
              <option value={CONTRACT_ADDRESSES.tokenA}>Token A</option>
              <option value={CONTRACT_ADDRESSES.tokenC}>Token C (如可用)</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button
          className="btn-swap"
          onClick={handleSwap}
          disabled={loading || !amountIn}
        >
          {loading ? "处理中..." : "确认交换"}
        </button>

        <p className="info-text">
          💡 注: 交换比例为 1:1，没有手续费
        </p>
      </div>
    </div>
  );
}

export default SwapInterface;
