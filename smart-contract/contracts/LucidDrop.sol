// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LucidDropCasino {
    // === STATE VARIABLES ===
    address public owner;
    uint256 public houseEdge = 5; // 5% house edge
    mapping(address => uint256) public balances;
    mapping(address => uint256) public totalWagered;
    mapping(address => uint256) public totalWon;
    
    // Commit-reveal for provably fair randomness
    struct Commitment {
        bytes32 commitmentHash;
        uint256 revealBlock;
        bool revealed;
        uint256 secret;
        bool used;
    }
    mapping(address => Commitment) public commitments;
    
    // === EVENTS ===
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event BetPlaced(address indexed user, uint256 amount, uint256 multiplier, bool won, uint256 payout, uint256 random);
    event CommitmentMade(address indexed user, bytes32 commitmentHash, uint256 revealBlock);
    event CommitmentRevealed(address indexed user, uint256 secret);
    
    // === MODIFIERS ===
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier hasBalance(uint256 amount) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        _;
    }
    
    // === CONSTRUCTOR ===
    constructor() {
        owner = msg.sender;
    }
    
    // === DEPOSIT ===
    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    // === WITHDRAW ===
    function withdraw(uint256 amount) external hasBalance(amount) {
        balances[msg.sender] -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
    
    // === COMMIT-REVEAL ===
    
    /**
     * @dev Commit to a secret for provably fair randomness
     * @param commitmentHash The keccak256 hash of the secret
     */
    function commit(bytes32 commitmentHash) external {
        require(commitmentHash != bytes32(0), "Invalid commitment");
        require(!commitments[msg.sender].used, "Commitment already used");
        
        commitments[msg.sender] = Commitment({
            commitmentHash: commitmentHash,
            revealBlock: block.number + 10,
            revealed: false,
            secret: 0,
            used: false
        });
        
        emit CommitmentMade(msg.sender, commitmentHash, block.number + 10);
    }
    
    /**
     * @dev Reveal the secret and use it for randomness
     * @param secret The original secret used to create the commitment
     */
    function reveal(uint256 secret) external returns (uint256 random) {
        Commitment storage c = commitments[msg.sender];
        require(c.commitmentHash != bytes32(0), "No commitment");
        require(!c.revealed, "Already revealed");
        require(block.number >= c.revealBlock, "Too early to reveal");
        
        // Verify the secret matches the commitment
        require(c.commitmentHash == keccak256(abi.encodePacked(secret)), "Invalid secret");
        
        c.revealed = true;
        c.secret = secret;
        c.used = true;
        
        // Generate randomness from secret and block data
        random = uint256(keccak256(abi.encodePacked(
            secret,
            block.timestamp,
            block.prevrandao,
            msg.sender,
            block.number
        ))) % 100;
        
        emit CommitmentRevealed(msg.sender, secret);
    }
    
    /**
     * @dev Get the current commitment status for a user
     */
    function getCommitment(address user) external view returns (
        bytes32 commitmentHash,
        uint256 revealBlock,
        bool revealed,
        bool used
    ) {
        Commitment memory c = commitments[user];
        return (c.commitmentHash, c.revealBlock, c.revealed, c.used);
    }
    
    // === PLACE BET ===
    
    /**
     * @dev Place a bet using committed randomness
     * @param amount The amount to bet
     * @param multiplier The multiplier for the bet
     */
    function placeBet(uint256 amount, uint256 multiplier) external hasBalance(amount) {
        require(multiplier > 1, "Multiplier must be > 1");
        require(multiplier <= 100, "Multiplier too high");
        
        Commitment storage c = commitments[msg.sender];
        require(c.revealed, "Must reveal commitment first");
        require(c.used, "Commitment already used");
        
        // Use the revealed secret for randomness
        uint256 random = uint256(keccak256(abi.encodePacked(
            c.secret,
            block.timestamp,
            block.prevrandao,
            msg.sender,
            amount,
            block.number
        ))) % 100;
        
        // Mark commitment as used
        c.used = false;
        
        // Process the bet
        balances[msg.sender] -= amount;
        totalWagered[msg.sender] += amount;
        
        bool won = random > houseEdge;
        uint256 payout = 0;
        
        if (won) {
            payout = amount * multiplier;
            balances[msg.sender] += payout;
            totalWon[msg.sender] += payout;
        }
        
        emit BetPlaced(msg.sender, amount, multiplier, won, payout, random);
    }
    
    // === VIEW FUNCTIONS ===
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    function getStats(address user) external view returns (uint256 wagered, uint256 won) {
        return (totalWagered[user], totalWon[user]);
    }
    
    // === OWNER FUNCTIONS ===
    function setHouseEdge(uint256 newEdge) external onlyOwner {
        require(newEdge <= 20, "Edge must be <= 20%");
        houseEdge = newEdge;
    }
    
    function withdrawOwnerFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Not enough funds");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }
}