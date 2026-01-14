import React from "react";
import "./WalletConnect.css";

function WalletConnect({ onConnect }) {
  return (
    <button className="btn-connect" onClick={onConnect}>
      🦊 连接MetaMask钱包
    </button>
  );
}

export default WalletConnect;
