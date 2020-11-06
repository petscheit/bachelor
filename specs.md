# Bachelor's Thesis


## Specs Smart Contract:


### Variables:

`uint treeIndex` - public variable that indicates the next free leaf in the merkle tree

`bytes32 addressBook` - merkle root of the addressBook merkle tree

`bytes32 balances` - merkle root of the balances merkle tree


### Functions:

`register(merklePath)` - users address is stored in merkle tree. The root is recomputed and stored in smart contract, while the new branches are emitted via event.

`deposit(merklePath, amount)` - provide merkle path where A[i] == msg.sender, then update B[i] with new amount. root gets recalculated and stored, and new branch emitted via event. The method can also be used for withdrawing balances, the amout must be negative then.

`trade(merklePath, basePair, amount)`