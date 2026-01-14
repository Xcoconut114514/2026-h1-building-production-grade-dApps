import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./LiquidityInterface.css";
import MINISWAP_ABI from "../contracts/MiniSwap.json";
import TOKEN_ABI from "../contracts/Token.json";

const CONTRACT_ADDRESSES = {
  miniswap: "0x5FbDB2315678afccb333f8a9c960e0773A0EfaCa",
  tokenA: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  tokenB: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

function LiquidityInterface({ account, signer }) {
  const [tokenA, setTokenA] = useState(CONTRACT_ADDRESSES.tokenA);
  const [tokenB, setTokenB] = useState(CONTRACT_ADDRESSES.tokenB);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");
  const [userShares, setUserShares] = useState("0");
  const [poolInfo, setPoolInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeMode, setActiveMode] = useState("add");

  // 加载余额和池信息
  useEffect(() => {
    if (account && signer) {
      fetchBalances();
      fetchPoolInfo();
    }
  }, [account, tokenA, tokenB, signer]);

  const fetchBalances = async () => {
    try {
      const tokenAContract = new ethers.Contract(tokenA, TOKEN_ABI, signer);
      const tokenBContract = new ethers.Contract(tokenB, TOKEN_ABI, signer);

      const balA = await tokenAContract.balanceOf(account);
      const balB = await tokenBContract.balanceOf(account);

      setBalanceA(ethers.formatEther(balA));
      setBalanceB(ethers.formatEther(balB));
    } catch (error) {
      console.error("获取余额失败:", error);
    }
  };

  const fetchPoolInfo = async () => {
    try {
      const miniswapContract = new ethers.Contract(
        CONTRACT_ADDRESSES.miniswap,
        MINISWAP_ABI,
        signer
      );

      const poolInfo = await miniswapContract.getPoolInfo(tokenA, tokenB);
      const shares = await miniswapContract.getUserShares(
        tokenA,
        tokenB,
        account
      );

      setPoolInfo({
        balanceA: ethers.formatEther(poolInfo.balanceA),
        balanceB: ethers.formatEther(poolInfo.balanceB),
        totalShares: ethers.formatEther(poolInfo.totalShares),
      });
      setUserShares(ethers.formatEther(shares));
    } catch (error) {
      console.error("获取池信息失败:", error);
    }
  };

  const handleAddLiquidity = async () => {
    setError("");
    setSuccess("");

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      setError("请输入有效的金额");
      return;
    }

    setLoading(true);
    try {
      const miniswapContract = new ethers.Contract(
        CONTRACT_ADDRESSES.miniswap,
        MINISWAP_ABI,
        signer
      );

      // 授权代币
      const tokenAContract = new ethers.Contract(tokenA, TOKEN_ABI, signer);
      const tokenBContract = new ethers.Contract(tokenB, TOKEN_ABI, signer);

      const amountAWei = ethers.parseEther(amountA);
      const amountBWei = ethers.parseEther(amountB);

      let allowanceA = await tokenAContract.allowance(account, CONTRACT_ADDRESSES.miniswap);
      if (allowanceA < amountAWei) {
        setError("正在授权Token A...");
        await tokenAContract.approve(
          CONTRACT_ADDRESSES.miniswap,
          ethers.MaxUint256
        );
      }

      let allowanceB = await tokenBContract.allowance(account, CONTRACT_ADDRESSES.miniswap);
      if (allowanceB < amountBWei) {
        setError("正在授权Token B...");
        await tokenBContract.approve(
          CONTRACT_ADDRESSES.miniswap,
          ethers.MaxUint256
        );
      }

      // 添加流动性
      setError("正在添加流动性...");
      const tx = await miniswapContract.addLiquidity(
        tokenA,
        tokenB,
        amountAWei,
        amountBWei
      );
      await tx.wait();

      setSuccess("✓ 流动性已添加!");
      setAmountA("");
      setAmountB("");
      fetchBalances();
      fetchPoolInfo();
    } catch (error) {
      setError(`添加失败: ${error.message}`);
      console.error("添加流动性错误:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    setError("");
    setSuccess("");

    if (!amountA || parseFloat(amountA) <= 0) {
      setError("请输入有效的份额数量");
      return;
    }

    setLoading(true);
    try {
      const miniswapContract = new ethers.Contract(
        CONTRACT_ADDRESSES.miniswap,
        MINISWAP_ABI,
        signer
      );

      const sharesWei = ethers.parseEther(amountA);

      setError("正在移除流动性...");
      const tx = await miniswapContract.removeLiquidity(
        tokenA,
        tokenB,
        sharesWei
      );
      await tx.wait();

      setSuccess("✓ 流动性已移除!");
      setAmountA("");
      setAmountB("");
      fetchBalances();
      fetchPoolInfo();
    } catch (error) {
      setError(`移除失败: ${error.message}`);
      console.error("移除流动性错误:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquidity-interface">
      <h2>💧 流动性管理</h2>
      <p className="subtitle">添加或移除流动性来赚取交易手续费</p>

      <div className="mode-tabs">
        <button
          className={`mode-tab ${activeMode === "add" ? "active" : ""}`}
          onClick={() => setActiveMode("add")}
        >
          ➕ 添加流动性
        </button>
        <button
          className={`mode-tab ${activeMode === "remove" ? "active" : ""}`}
          onClick={() => setActiveMode("remove")}
        >
          ➖ 移除流动性
        </button>
      </div>

      <div className="pool-stats">
        <div className="stat">
          <span className="label">你的份额</span>
          <span className="value">{parseFloat(userShares).toFixed(6)}</span>
        </div>
        {poolInfo && (
          <>
            <div className="stat">
              <span className="label">池中Token A</span>
              <span className="value">{parseFloat(poolInfo.balanceA).toFixed(4)}</span>
            </div>
            <div className="stat">
              <span className="label">池中Token B</span>
              <span className="value">{parseFloat(poolInfo.balanceB).toFixed(4)}</span>
            </div>
          </>
        )}
      </div>

      {activeMode === "add" ? (
        <div className="liquidity-form">
          <div className="input-group">
            <label>Token A (余额: {parseFloat(balanceA).toFixed(4)})</label>
            <input
              type="number"
              placeholder="0.0"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              disabled={loading}
            />
            <select
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              disabled={loading}
            >
              <option value={CONTRACT_ADDRESSES.tokenA}>Token A</option>
              <option value={CONTRACT_ADDRESSES.tokenB}>Token B</option>
            </select>
          </div>

          <div className="input-group">
            <label>Token B (余额: {parseFloat(balanceB).toFixed(4)})</label>
            <input
              type="number"
              placeholder="0.0"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              disabled={loading}
            />
            <select
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              disabled={loading}
            >
              <option value={CONTRACT_ADDRESSES.tokenB}>Token B</option>
              <option value={CONTRACT_ADDRESSES.tokenA}>Token A</option>
            </select>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button
            className="btn-action"
            onClick={handleAddLiquidity}
            disabled={loading || !amountA || !amountB}
          >
            {loading ? "处理中..." : "添加流动性"}
          </button>
        </div>
      ) : (
        <div className="liquidity-form">
          <div className="input-group">
            <label>移除的份额数量 (拥有: {parseFloat(userShares).toFixed(6)})</label>
            <input
              type="number"
              placeholder="0.0"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button
            className="btn-action btn-remove"
            onClick={handleRemoveLiquidity}
            disabled={loading || !amountA}
          >
            {loading ? "处理中..." : "移除流动性"}
          </button>
        </div>
      )}

      <p className="info-text">
        💡 注: 添加流动性前确保两种代币的金额匹配，以获得最佳的份额计算结果
      </p>
    </div>
  );
}

export default LiquidityInterface;
