import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import SwapInterface from "./components/SwapInterface";
import LiquidityInterface from "./components/LiquidityInterface";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [activeTab, setActiveTab] = useState("swap");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("请安装MetaMask钱包");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const ethSigner = await ethProvider.getSigner();

      setProvider(ethProvider);
      setSigner(ethSigner);
      setAccount(accounts[0]);
    } catch (error) {
      console.error("连接钱包失败:", error);
      alert("连接钱包失败: " + error.message);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
  };

  useEffect(() => {
    // 检查MetaMask是否已连接
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🔄 MiniSwap</h1>
        <p>简易DEX - 流动性交换协议</p>
        {account ? (
          <div className="wallet-info">
            <span className="account">
              {account.substring(0, 6)}...{account.substring(38)}
            </span>
            <button className="btn-disconnect" onClick={disconnectWallet}>
              断开连接
            </button>
          </div>
        ) : (
          <WalletConnect onConnect={connectWallet} />
        )}
      </header>

      {account ? (
        <main className="main-content">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "swap" ? "active" : ""}`}
              onClick={() => setActiveTab("swap")}
            >
              💱 交换
            </button>
            <button
              className={`tab ${activeTab === "liquidity" ? "active" : ""}`}
              onClick={() => setActiveTab("liquidity")}
            >
              💧 流动性
            </button>
          </div>

          <div className="content">
            {activeTab === "swap" && (
              <SwapInterface account={account} signer={signer} />
            )}
            {activeTab === "liquidity" && (
              <LiquidityInterface account={account} signer={signer} />
            )}
          </div>
        </main>
      ) : (
        <div className="welcome">
          <div className="welcome-content">
            <h2>欢迎来到MiniSwap</h2>
            <p>一个简易但功能完整的去中心化交换协议</p>
            <div className="features">
              <div className="feature">
                <span className="icon">💧</span>
                <h3>提供流动性</h3>
                <p>赚取交易手续费</p>
              </div>
              <div className="feature">
                <span className="icon">💱</span>
                <h3>交换代币</h3>
                <p>1:1 简易交换</p>
              </div>
              <div className="feature">
                <span className="icon">🔒</span>
                <h3>安全可靠</h3>
                <p>防重入攻击</p>
              </div>
            </div>
            <button className="btn-primary" onClick={connectWallet}>
              连接钱包开始使用
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>MiniSwap © 2026 | 学习项目</p>
      </footer>
    </div>
  );
}

export default App;
