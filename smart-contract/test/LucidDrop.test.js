const { expect } = require("chai");

describe("LucidDropCasino", function () {
  let casino, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const LucidDropCasino = await ethers.getContractFactory("LucidDropCasino");
    casino = await LucidDropCasino.deploy();
    await casino.waitForDeployment();
  });

  it("Should allow deposits", async function () {
    await casino.connect(user).deposit({ value: ethers.parseEther("1") });
    const balance = await casino.getBalance(user.address);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Should allow withdrawals", async function () {
    await casino.connect(user).deposit({ value: ethers.parseEther("1") });
    await casino.connect(user).withdraw(ethers.parseEther("0.5"));
    const balance = await casino.getBalance(user.address);
    expect(balance).to.equal(ethers.parseEther("0.5"));
  });

  it("Should place a bet", async function () {
    await casino.connect(user).deposit({ value: ethers.parseEther("1") });
    await casino.connect(user).placeBet(ethers.parseEther("0.1"), 2);
    const balance = await casino.getBalance(user.address);
    expect(balance).to.be.lessThan(ethers.parseEther("1"));
  });
});