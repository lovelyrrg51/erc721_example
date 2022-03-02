/* eslint-disable no-undef */
const { default: BigNumber } = require("bignumber.js");
const { assert } = require("chai");
const { artifacts } = require("hardhat");
const { web3 } = require("hardhat");
const truffleAssert = require("truffle-assertions");

const ExcitedApe = artifacts.require("ExcitedApe");

const { callMethod } = require("./utils.js");

contract("ERC721 - Test", (accounts) => {
  const deployer = accounts[0];
  const defaultValue = "10000000000000000";
  const twoETHValue = "2000000000000000000";
  const baseNFTURI = "https://excitedapeyachtclub.io/api/image/";

  beforeEach(async () => {
    // Excited Ape Contract
    this.ExcitedApeInstance = await ExcitedApe.new(accounts[1], accounts[2], {
      from: deployer,
    });
    // console.log(this.BoneDucksInstance.address, this.BoneDucksInstance.abi);
    // Excited Ape
    this.ExcitedApe = await new web3.eth.Contract(
      this.ExcitedApeInstance.abi,
      this.ExcitedApeInstance.address
    );
  });

  describe("Test - Initial Parameters", async () => {
    it("Check Supplies", async () => {
      // Check Presale Supply
      assert.equal(
        await callMethod(this.ExcitedApe.methods.maxPrivateSupply, []),
        1000
      );

      // Check First Public Supply
      assert.equal(
        await callMethod(this.ExcitedApe.methods.firstPublicSupply, []),
        5000
      );

      // Check Second Public Supply
      assert.equal(
        await callMethod(this.ExcitedApe.methods.secondPublicSupply, []),
        10000
      );
    });

    it("Check Prices", async () => {
      // Check Presale Mint Price
      assert.equal(
        await callMethod(this.ExcitedApe.methods.presaleMintPrice, []),
        "42000000000000000"
      );

      // Check First Public Mint Price
      assert.equal(
        await callMethod(this.ExcitedApe.methods.firstPublicMintPrice, []),
        "69000000000000000"
      );

      // Check Second Public Mint Price
      assert.equal(
        await callMethod(this.ExcitedApe.methods.secondPublicMintPrice, []),
        "80000000000000000"
      );
    });

    it("Check Sale Active Flags", async () => {
      // Check Private Mint Flag
      assert.equal(
        await callMethod(this.ExcitedApe.methods.privateMintActive, []),
        false
      );

      // Check Public Mint Flag
      assert.equal(
        await callMethod(this.ExcitedApe.methods.publicMintActive, []),
        false
      );

      // Check Max Private Presale Tx Count
      assert.equal(
        await callMethod(this.ExcitedApe.methods.maxPerPresaleTx, []),
        3
      );

      // Check Max Public Presale Tx Count
      assert.equal(await callMethod(this.ExcitedApe.methods.maxPerTx, []), 30);
    });

    it("Check Dev Addresses", async () => {
      // Check Dev Address1
      assert.equal(
        await callMethod(this.ExcitedApe.methods.dev1Address, []),
        accounts[1]
      );

      // Check Dev Address2
      assert.equal(
        await callMethod(this.ExcitedApe.methods.dev2Address, []),
        accounts[2]
      );
    });
  });

  describe("Test - Presale Mint", async () => {
    beforeEach(async () => {
      // Set Private Mint Flag
      await this.ExcitedApeInstance.updatePrivateMintSale(true, {
        from: deployer,
      });
      // Set Base URI
      await this.ExcitedApeInstance.setBaseURI(baseNFTURI, {
        from: deployer,
      });
      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 30, {
        from: deployer,
      });
    });

    it("Check Wrong Cases", async () => {
      // Check Mint without Whitelist
      await truffleAssert.reverts(
        this.ExcitedApeInstance.privateMint(3, {
          value: defaultValue,
          from: accounts[1],
        }),
        "You're not in white list"
      );

      // Update WhiteList
      await this.ExcitedApeInstance.updateWhiteList([accounts[1]], {
        from: deployer,
      });

      // Check Mint over 3
      await truffleAssert.reverts(
        this.ExcitedApeInstance.privateMint(4, {
          value: defaultValue,
          from: accounts[1],
        }),
        "Should not more than 3"
      );

      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(2, 20, 30, {
        from: deployer,
      });

      // Check Mint over Private Sale Amount
      await truffleAssert.reverts(
        this.ExcitedApeInstance.privateMint(3, {
          value: defaultValue,
          from: accounts[1],
        }),
        "Exceed Private Sale Amount"
      );

      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 30, {
        from: deployer,
      });

      // Check Mint Not Enough ETHs
      await truffleAssert.reverts(
        this.ExcitedApeInstance.privateMint(3, {
          value: defaultValue,
          from: accounts[1],
        }),
        "Not Enough ETH"
      );
    });

    it("Test - Private Mint", async () => {
      // Update White List
      await this.ExcitedApeInstance.updateWhiteList([accounts[1]], {
        from: deployer,
      });

      await this.ExcitedApeInstance.privateMint(3, {
        value: twoETHValue,
        from: accounts[1],
      });

      const userBalance = await callMethod(this.ExcitedApe.methods.balanceOf, [
        accounts[1],
      ]);
      const tokenIdList = await callMethod(
        this.ExcitedApe.methods.tokenOfOwnerByIndex,
        [accounts[1]]
      );

      assert.equal(userBalance, 3);
      for (let i = 0; i < userBalance; i += 1) {
        assert.equal(tokenIdList[i], i);
        const tokenURL = await callMethod(this.ExcitedApe.methods.tokenURI, [
          i,
        ]);
        assert.equal(`${baseNFTURI}${i}`, tokenURL);
      }
    });
  });

  describe("Test - Public Mint", async () => {
    beforeEach(async () => {
      // Set Public Mint Flag
      await this.ExcitedApeInstance.updatePublicMintSale(true, {
        from: deployer,
      });
      // Set Base URI
      await this.ExcitedApeInstance.setBaseURI(baseNFTURI, {
        from: deployer,
      });
      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 30, {
        from: deployer,
      });
    });

    it("Check Wrong Case", async () => {
      // Check Mint Over Public Sale Amount
      await truffleAssert.reverts(
        this.ExcitedApeInstance.publicMint(31, {
          value: defaultValue,
          from: accounts[1],
        }),
        "No Excited Ape left"
      );

      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 40, {
        from: deployer,
      });

      // Check Mint Over Public Sale Amount
      await truffleAssert.reverts(
        this.ExcitedApeInstance.publicMint(31, {
          value: defaultValue,
          from: accounts[1],
        }),
        "30 max per tx"
      );

      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 30, {
        from: deployer,
      });

      // Check Mint Over Public Sale Amount
      await truffleAssert.reverts(
        this.ExcitedApeInstance.publicMint(20, {
          value: defaultValue,
          from: accounts[1],
        }),
        "Not Enough ETH"
      );
    });

    it("Check Public Mint", async () => {
      const firstMintPrice = await callMethod(
        this.ExcitedApe.methods.getMintPrice,
        [10]
      );

      assert.equal(firstMintPrice, "690000000000000000");

      await this.ExcitedApeInstance.publicMint(10, {
        value: firstMintPrice,
        from: accounts[1],
      });

      const secondMintPrice = await callMethod(
        this.ExcitedApe.methods.getMintPrice,
        [15]
      );

      assert.equal(secondMintPrice, "1090000000000000000");

      await this.ExcitedApeInstance.publicMint(15, {
        value: secondMintPrice,
        from: accounts[1],
      });

      const thirdMintPrice = await callMethod(
        this.ExcitedApe.methods.getMintPrice,
        [5]
      );

      assert.equal(thirdMintPrice, "400000000000000000");
      await this.ExcitedApeInstance.publicMint(5, {
        value: thirdMintPrice,
        from: accounts[1],
      });

      const userBalance = await callMethod(this.ExcitedApe.methods.balanceOf, [
        accounts[1],
      ]);
      const tokenIdList = await callMethod(
        this.ExcitedApe.methods.tokenOfOwnerByIndex,
        [accounts[1]]
      );

      assert.equal(userBalance, 30);
      for (let i = 0; i < userBalance; i += 1) {
        assert.equal(tokenIdList[i], i);
        const tokenURL = await callMethod(this.ExcitedApe.methods.tokenURI, [
          i,
        ]);
        assert.equal(`${baseNFTURI}${i}`, tokenURL);
      }

      // Check Withdraw
      const contractBalance = new BigNumber(
        await web3.eth.getBalance(this.ExcitedApeInstance.address)
      );
      const totalBalance = new BigNumber(firstMintPrice)
        .plus(new BigNumber(secondMintPrice))
        .plus(new BigNumber(thirdMintPrice));

      // console.log(contractBalance.toFixed(), totalBalance.toFixed());
      assert.equal(contractBalance.toFixed(), totalBalance.toFixed());

      const user1Reward = totalBalance.multipliedBy(20).dividedBy(100);
      const user2Reward = totalBalance.minus(user1Reward);

      const oldUser1Balance = await web3.eth.getBalance(accounts[1]);
      const oldUser2Balance = await web3.eth.getBalance(accounts[2]);

      await this.ExcitedApeInstance.withdrawAll({ from: deployer });

      const newUser1Balance = await web3.eth.getBalance(accounts[1]);
      const newUser2Balance = await web3.eth.getBalance(accounts[2]);

      assert.equal(
        user1Reward.toFixed(),
        new BigNumber(newUser1Balance).minus(oldUser1Balance).toFixed()
      );

      assert.equal(
        user2Reward.toFixed(),
        new BigNumber(newUser2Balance).minus(oldUser2Balance).toFixed()
      );

      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 40, {
        from: deployer,
      });
      // Check Reserve Excited Apes
      await this.ExcitedApeInstance.reserveExcitedApe(accounts[2], 10);

      const user2Balance = await callMethod(this.ExcitedApe.methods.balanceOf, [
        accounts[2],
      ]);
      assert.equal(user2Balance, 10);

      const tokenId2List = await callMethod(
        this.ExcitedApe.methods.tokenOfOwnerByIndex,
        [accounts[2]]
      );

      for (let i = 30; i < 40; i += 1) {
        assert.equal(tokenId2List[i - 30], i);
        const tokenURL = await callMethod(this.ExcitedApe.methods.tokenURI, [
          i,
        ]);
        assert.equal(`${baseNFTURI}${i}`, tokenURL);
      }
    });
  });

  describe("Test - Transfer", async () => {
    beforeEach(async () => {
      // Set Public Mint Flag
      await this.ExcitedApeInstance.updatePublicMintSale(true, {
        from: deployer,
      });
      // Set Base URI
      await this.ExcitedApeInstance.setBaseURI(baseNFTURI, {
        from: deployer,
      });
      // Update Supplies
      await this.ExcitedApeInstance.updateSaleAmount(10, 20, 30, {
        from: deployer,
      });
    });

    it("Check Public Mint", async () => {
      const firstMintPrice = await callMethod(
        this.ExcitedApe.methods.getMintPrice,
        [10]
      );

      assert.equal(firstMintPrice, "690000000000000000");

      await this.ExcitedApeInstance.publicMint(10, {
        value: firstMintPrice,
        from: accounts[1],
      });

      // Approve
      await this.ExcitedApeInstance.approve(accounts[0], "0", {
        from: accounts[1],
      });

      // Transfer
      await this.ExcitedApeInstance.safeTransferFrom(
        accounts[1],
        accounts[2],
        "0",
        {
          from: accounts[0],
        }
      );

      const user1Balance = await callMethod(this.ExcitedApe.methods.balanceOf, [
        accounts[1],
      ]);

      const user2Balance = await callMethod(this.ExcitedApe.methods.balanceOf, [
        accounts[2],
      ]);

      assert.equal(user1Balance, 9);
      assert.equal(user2Balance, 1);
    });
  });
});
