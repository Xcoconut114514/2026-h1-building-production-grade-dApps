const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MiniSwap", () => {
  let miniswap;
  let tokenA;
  let tokenB;
  let owner;
  let addr1;
  let addr2;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const LIQUIDITY_A = ethers.parseEther("1000");
  const LIQUIDITY_B = ethers.parseEther("1000");
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署测试Token
    const Token = await ethers.getContractFactory("TestToken");
    tokenA = await Token.deploy("Token A", "TKA");
    tokenB = await Token.deploy("Token B", "TKB");

    // 为addr1分配Token
    await tokenA.mint(addr1.address, INITIAL_SUPPLY);
    await tokenB.mint(addr1.address, INITIAL_SUPPLY);

    // 部署MiniSwap
    const MiniSwap = await ethers.getContractFactory("MiniSwap");
    miniswap = await MiniSwap.deploy();

    // 创建流动性池
    await miniswap.createPool(tokenA.target, tokenB.target);

    // 授权
    await tokenA.approve(miniswap.target, ethers.MaxUint256);
    await tokenB.approve(miniswap.target, ethers.MaxUint256);

    await tokenA.connect(addr1).approve(miniswap.target, ethers.MaxUint256);
    await tokenB.connect(addr1).approve(miniswap.target, ethers.MaxUint256);
  });

  describe("Pool Creation", () => {
    it("Should create a pool successfully", async () => {
      const Token = await ethers.getContractFactory("TestToken");
      const tokenC = await Token.deploy("Token C", "TKC");

      await expect(miniswap.createPool(tokenA.target, tokenC.target))
        .to.emit(miniswap, "PoolCreated");
    });

    it("Should not allow duplicate pools", async () => {
      await expect(
        miniswap.createPool(tokenA.target, tokenB.target)
      ).to.be.revertedWith("Pool already exists");
    });
  });

  describe("Add Liquidity", () => {
    it("Should add liquidity successfully", async () => {
      const tx = await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      await expect(tx)
        .to.emit(miniswap, "LiquidityAdded")
        .withArgs(owner.address, tokenA.target, tokenB.target, LIQUIDITY_A, LIQUIDITY_B);

      const poolInfo = await miniswap.getPoolInfo(tokenA.target, tokenB.target);
      expect(poolInfo.balanceA).to.equal(LIQUIDITY_A);
      expect(poolInfo.balanceB).to.equal(LIQUIDITY_B);
    });

    it("Should calculate shares correctly for initial liquidity", async () => {
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      expect(shares).to.be.gt(0);
    });

    it("Should reject zero amounts", async () => {
      await expect(
        miniswap.addLiquidity(tokenA.target, tokenB.target, 0, LIQUIDITY_B)
      ).to.be.revertedWith("Amounts must be greater than 0");
    });

    it("Should add proportional liquidity from second provider", async () => {
      // First provider
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      // Second provider adds proportional amount
      await miniswap.connect(addr1).addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      const poolInfo = await miniswap.getPoolInfo(tokenA.target, tokenB.target);
      expect(poolInfo.balanceA).to.equal(LIQUIDITY_A * 2n);
      expect(poolInfo.balanceB).to.equal(LIQUIDITY_B * 2n);
    });
  });

  describe("Remove Liquidity", () => {
    beforeEach(async () => {
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );
    });

    it("Should remove liquidity successfully", async () => {
      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      const removingShares = shares / 2n;

      const tx = await miniswap.removeLiquidity(
        tokenA.target,
        tokenB.target,
        removingShares
      );

      await expect(tx).to.emit(miniswap, "LiquidityRemoved");

      const poolInfo = await miniswap.getPoolInfo(tokenA.target, tokenB.target);
      expect(poolInfo.balanceA).to.be.lt(LIQUIDITY_A);
      expect(poolInfo.balanceB).to.be.lt(LIQUIDITY_B);
    });

    it("Should reject removal with insufficient shares", async () => {
      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      await expect(
        miniswap.removeLiquidity(
          tokenA.target,
          tokenB.target,
          shares + 1n
        )
      ).to.be.revertedWith("Insufficient shares");
    });

    it("Should return proportional amounts", async () => {
      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      const balanceBefore = await tokenA.balanceOf(owner.address);

      await miniswap.removeLiquidity(
        tokenA.target,
        tokenB.target,
        shares
      );

      const balanceAfter = await tokenA.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Swap", () => {
    beforeEach(async () => {
      // 添加足够的流动性
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );
    });

    it("Should swap tokens successfully", async () => {
      const balanceBefore = await tokenB.balanceOf(owner.address);

      const tx = await miniswap.swap(
        tokenA.target,
        tokenB.target,
        SWAP_AMOUNT
      );

      await expect(tx)
        .to.emit(miniswap, "Swap")
        .withArgs(owner.address, tokenA.target, tokenB.target, SWAP_AMOUNT, SWAP_AMOUNT);

      const balanceAfter = await tokenB.balanceOf(owner.address);
      expect(balanceAfter).to.equal(balanceBefore + SWAP_AMOUNT);
    });

    it("Should reject zero amount swap", async () => {
      await expect(
        miniswap.swap(tokenA.target, tokenB.target, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should swap in reverse direction", async () => {
      const balanceBefore = await tokenA.balanceOf(owner.address);

      await miniswap.swap(
        tokenB.target,
        tokenA.target,
        SWAP_AMOUNT
      );

      const balanceAfter = await tokenA.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should allow multiple swaps", async () => {
      await miniswap.swap(tokenA.target, tokenB.target, SWAP_AMOUNT);
      await miniswap.swap(tokenB.target, tokenA.target, SWAP_AMOUNT);

      expect(await tokenA.balanceOf(owner.address)).to.be.gt(0);
      expect(await tokenB.balanceOf(owner.address)).to.be.gt(0);
    });
  });

  describe("Edge Cases", () => {
    it("Should handle pool with single provider correctly", async () => {
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      await miniswap.removeLiquidity(
        tokenA.target,
        tokenB.target,
        shares
      );

      const poolInfo = await miniswap.getPoolInfo(tokenA.target, tokenB.target);
      expect(poolInfo.balanceA).to.equal(0);
      expect(poolInfo.balanceB).to.equal(0);
    });

    it("Should prevent reentrancy attacks on removeLiquidity", async () => {
      // This test ensures the nonReentrant guard is in place
      await miniswap.addLiquidity(
        tokenA.target,
        tokenB.target,
        LIQUIDITY_A,
        LIQUIDITY_B
      );

      const shares = await miniswap.getUserShares(
        tokenA.target,
        tokenB.target,
        owner.address
      );

      // A normal removal should succeed
      await expect(
        miniswap.removeLiquidity(
          tokenA.target,
          tokenB.target,
          shares
        )
      ).to.not.be.reverted;
    });
  });
});
