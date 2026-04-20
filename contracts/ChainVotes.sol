// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ChainVotes — Decentralized Governance on Sepolia
/// @notice Proposal creation + on-chain voting (FOR / AGAINST / ABSTAIN)
contract ChainVotes {
    // ─────────────────────── Types ───────────────────────
    enum VoteChoice { None, Yes, No, Abstain }
    enum ProposalStatus { Pending, Active, Ended }

    struct Proposal {
        uint256 id;
        string  title;
        string  description;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 quorum;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        bool    exists;
    }

    // ─────────────────────── Storage ─────────────────────
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    /// voter => proposalId => choice
    mapping(address => mapping(uint256 => VoteChoice)) public votes;

    // ─────────────────────── Events ──────────────────────
    event ProposalCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256 quorum
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice
    );

    // ─────────────────────── Errors ──────────────────────
    error ProposalNotFound(uint256 id);
    error ProposalNotActive(uint256 id);
    error AlreadyVoted(uint256 id, address voter);
    error InvalidDuration();
    error TitleTooShort();
    error DescriptionTooShort();

    // ──────────────────── Write Functions ────────────────

    /// @notice Create a new proposal
    /// @param _title       Min 10 chars
    /// @param _description Min 20 chars
    /// @param _durationSec Voting window in seconds (e.g. 86400 = 1 day). 0 = immediate active, no delay.
    /// @param _quorum      Minimum total votes for proposal to be considered valid
    function createProposal(
        string calldata _title,
        string calldata _description,
        uint256 _durationSec,
        uint256 _quorum
    ) external returns (uint256) {
        if (bytes(_title).length < 10)       revert TitleTooShort();
        if (bytes(_description).length < 20) revert DescriptionTooShort();
        if (_durationSec == 0)               revert InvalidDuration();

        proposalCount++;
        uint256 id = proposalCount;

        proposals[id] = Proposal({
            id:            id,
            title:         _title,
            description:   _description,
            creator:       msg.sender,
            startTime:     block.timestamp,
            endTime:       block.timestamp + _durationSec,
            quorum:        _quorum,
            yesVotes:      0,
            noVotes:       0,
            abstainVotes:  0,
            exists:        true
        });

        emit ProposalCreated(id, msg.sender, _title, block.timestamp, block.timestamp + _durationSec, _quorum);
        return id;
    }

    /// @notice Cast a vote on an active proposal
    /// @param _proposalId  Target proposal
    /// @param _choice      1 = YES, 2 = NO, 3 = ABSTAIN
    function vote(uint256 _proposalId, VoteChoice _choice) external {
        Proposal storage p = proposals[_proposalId];
        if (!p.exists)                                   revert ProposalNotFound(_proposalId);
        if (block.timestamp < p.startTime || block.timestamp > p.endTime)
                                                         revert ProposalNotActive(_proposalId);
        if (votes[msg.sender][_proposalId] != VoteChoice.None)
                                                         revert AlreadyVoted(_proposalId, msg.sender);
        if (_choice == VoteChoice.None)                  revert ProposalNotActive(_proposalId);

        votes[msg.sender][_proposalId] = _choice;

        if (_choice == VoteChoice.Yes)         p.yesVotes++;
        else if (_choice == VoteChoice.No)     p.noVotes++;
        else                                   p.abstainVotes++;

        emit Voted(_proposalId, msg.sender, _choice);
    }

    // ──────────────────── View Functions ─────────────────

    /// @notice Returns all data for a single proposal
    function getProposal(uint256 _id) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        address creator,
        uint256 startTime,
        uint256 endTime,
        uint256 quorum,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 abstainVotes,
        ProposalStatus status
    ) {
        Proposal storage p = proposals[_id];
        if (!p.exists) revert ProposalNotFound(_id);

        ProposalStatus s;
        if (block.timestamp < p.startTime) s = ProposalStatus.Pending;
        else if (block.timestamp <= p.endTime) s = ProposalStatus.Active;
        else s = ProposalStatus.Ended;

        return (
            p.id, p.title, p.description, p.creator,
            p.startTime, p.endTime, p.quorum,
            p.yesVotes, p.noVotes, p.abstainVotes,
            s
        );
    }

    /// @notice Returns all proposals (for frontend pagination)
    function getAllProposals() external view returns (
        uint256[] memory ids,
        string[] memory titles,
        address[] memory creators,
        uint256[] memory yesArr,
        uint256[] memory noArr,
        uint256[] memory abstainArr,
        uint256[] memory endTimes,
        uint8[] memory statuses
    ) {
        uint256 count = proposalCount;
        ids       = new uint256[](count);
        titles    = new string[](count);
        creators  = new address[](count);
        yesArr    = new uint256[](count);
        noArr     = new uint256[](count);
        abstainArr= new uint256[](count);
        endTimes  = new uint256[](count);
        statuses  = new uint8[](count);

        for (uint256 i = 1; i <= count; i++) {
            Proposal storage p = proposals[i];
            uint256 idx = i - 1;
            ids[idx]        = p.id;
            titles[idx]     = p.title;
            creators[idx]   = p.creator;
            yesArr[idx]     = p.yesVotes;
            noArr[idx]      = p.noVotes;
            abstainArr[idx] = p.abstainVotes;
            endTimes[idx]   = p.endTime;

            if (block.timestamp < p.startTime) statuses[idx] = 0; // Pending
            else if (block.timestamp <= p.endTime) statuses[idx] = 1; // Active
            else statuses[idx] = 2; // Ended
        }
    }

    /// @notice Get voter's choice on a specific proposal (0=None, 1=Yes, 2=No, 3=Abstain)
    function getVote(address _voter, uint256 _proposalId) external view returns (VoteChoice) {
        return votes[_voter][_proposalId];
    }
}
