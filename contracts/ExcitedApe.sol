// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC721Update.sol";
import "./Ownable.sol";
import "./SafeMath.sol";
import "./Strings.sol";

contract ExcitedApe is ERC721Update, Ownable {
    using SafeMath for uint256;
    using Strings for uint256;

    uint256 private _tokenIdTracker;

    uint256 public maxPrivateSupply = 1000;
    uint256 public firstPublicSupply = 5000;
    uint256 public secondPublicSupply = 10000;
    uint256 public presaleMintPrice = 0.042 ether;
    uint256 public firstPublicMintPrice = 0.069 ether;
    uint256 public secondPublicMintPrice = 0.08 ether;
    uint256 public maxPerTx = 30;
    uint256 public maxPerPresaleTx = 3;

    address public dev1Address;
    address public dev2Address;

    bool public publicMintActive = false;
    bool public privateMintActive = false;

    mapping(address => bool) public userWhiteList; //Track free mints claimed per wallet

    string public baseTokenURI;

    modifier onlyWhiteList {
        require (
            userWhiteList[msg.sender] == true,
            "You're not in white list"
        );
        _;
    }

    modifier checkPublicSaleIsActive {
        require (
            publicMintActive,
            "Public Sale is not active"
        );
        _;
    }

    modifier checkPrivateSaleIsActive {
        require (
            privateMintActive,
            "Private Sale is not active"
        );
        _;
    }

    constructor(address dev1, address dev2) ERC721Update("Excited Ape Yacut Club", "EAYC") {
        dev1Address = dev1;
        dev2Address = dev2;
    }

    //-----------------------------------------------------------------------------//
    //------------------------------Mint Logic-------------------------------------//
    //-----------------------------------------------------------------------------//
    // Update WhiteList
    function updateWhiteList(address[] memory addressList) external onlyOwner {
        for (uint256 i = 0; i < addressList.length; i += 1) {
            userWhiteList[addressList[i]] = true;
        }
    }

    // Private Mint for first 1000, for whitelist users
    function privateMint(uint256 _count) public payable checkPrivateSaleIsActive onlyWhiteList {
        uint256 total = totalSupply();
        uint256 balance = balanceOf(msg.sender);

        require(balance + _count <= maxPerPresaleTx, "Should not more than 3");
        require(total + _count <= maxPrivateSupply, "Exceed Private Sale Amount");
        require(msg.value >= presaleMintPrice.mul(_count), "Not Enough ETH");

        for (uint i = 0; i < _count; i += 1) {
            _mintExcitedApes(msg.sender);
        }
    }

    // Public Mint with ETH
    function publicMint(uint256 _count) public payable checkPublicSaleIsActive {
        uint256 total = totalSupply();

        require(total + _count <= secondPublicSupply, "No Excited Ape left");
        require(_count <= maxPerTx, "30 max per tx");
        require(msg.value >= getMintPrice(_count), "Not Enough ETH");

        for (uint256 i = 0; i < _count; i++) {
            _mintExcitedApes(msg.sender);
        }
    }   

    // Mint Excited Ape
    function _mintExcitedApes(address _to) internal {
        uint id = _tokenIdTracker;
        _tokenIdTracker = _tokenIdTracker + 1;
        _safeMint(_to, id);
    }

    //Function to get price of minting a Duck
    function getMintPrice(uint256 _count) public view returns (uint256 totPrice) {
        uint256 totSupply = totalSupply();
        
        if (totSupply + _count < firstPublicSupply) {
            totPrice = firstPublicMintPrice.mul(_count);
        } else if (totSupply < firstPublicSupply && totSupply + _count >= firstPublicSupply) {
            totPrice = (firstPublicSupply.sub(totSupply)).mul(firstPublicMintPrice);
            uint256 secondSaleCount = totSupply.add(_count).sub(firstPublicSupply);
            totPrice = totPrice.add(secondSaleCount.mul(secondPublicMintPrice));
        } else if (totSupply > firstPublicSupply) {
            totPrice = secondPublicMintPrice.mul(_count);
        }
    }

    //-----------------------------------------------------------------------------//
    //---------------------------Admin & Internal Logic----------------------------//
    //-----------------------------------------------------------------------------//
    // Reserve Excited Apes
    function reserveExcitedApe(address _to, uint256 _count) external onlyOwner {
        uint256 total = totalSupply();

        require(total + _count <= secondPublicSupply, "No Excited Ape left");
        for (uint i = 0; i < _count; i += 1) {
            _mintExcitedApes(_to);
        }   
    }

    // Update Sale Amounts
    function updateSaleAmount(uint256 privateAmount, uint256 firstPublicAmount, uint256 secondPublicAmount) external onlyOwner {
        maxPrivateSupply = privateAmount;
        firstPublicSupply = firstPublicAmount;
        secondPublicSupply = secondPublicAmount;
    }

    // Update Sale Price
    function updateSalePrice(uint256 privatePrice, uint256 firstPublicPrice, uint256 secondPublicPrice) external onlyOwner {
        presaleMintPrice = privatePrice;
        firstPublicMintPrice = firstPublicPrice;
        secondPublicMintPrice = secondPublicPrice;
    }

    // Resume/pause Public Sale
    function updatePublicMintSale(bool flag) external onlyOwner {
        publicMintActive = flag;
    }

    // Resume/pause Private Sale
    function updatePrivateMintSale(bool flag) external onlyOwner {
        privateMintActive = flag;
    }

    // Set URI for metadata
    function setBaseURI(string memory baseURI) external onlyOwner {
        baseTokenURI = baseURI;
    }

    function tokenURI(uint256 tokenId) external view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
    } 

    // Withdraw from contract
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        uint256 dev1Share = balance.mul(2000).div(10000); // 20%
        uint256 dev2Share = balance.sub(dev1Share); // 80%

        _withdraw(dev1Address, dev1Share);
        _withdraw(dev2Address, dev2Share);
    }

    // Internal withdraw
    function _withdraw(address _address, uint256 _amount) internal {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed.");
    }
}