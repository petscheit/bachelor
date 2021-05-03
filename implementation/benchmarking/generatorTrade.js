const fs = require('fs');

function generateProgram(treeDepth, batchSize) {
    return `
import "hashes/sha256/embed/512bitPadded" as sha256
import "hashes/sha256/embed/1024bitPadded" as sha256_4
import "utils/pack/bool/pack256.zok" as pack256
import "utils/pack/bool/nonStrictUnpack256.zok" as field_to_bool
import "utils/casts/u32_8_to_bool_256.zok" as u32_8_to_bool_256
import "hashes/mimcSponge/mimcFeistel" as MiMCFeistel
import "utils/pack/bool/pack128.zok" as pack128
import "EMBED/unpack" as unpack

struct BalanceUpdate {
	field oldEthAmount
	field oldTokenAmount
	field oldNonce
	field newEthAmount
	field newTokenAmount
	field newNonce
	u32[5] address
	field[${treeDepth}][2] merklePath
}

def mimc_4(field[4] ins) -> field: //5281
	field nInputs = 4
	field nOutputs = 1
	field[4][2] S = [[0; 2]; 4] // Dim: (nInputs + nOutputs - 1, 2)
	field outs = 0

	for field i in 0..nInputs do
		field idx = if i == 0 then 0 else i - 1 fi
		S[i] = if i == 0 then MiMCFeistel(ins[0], 0, 0) else MiMCFeistel(S[idx][0] + ins[i], S[idx][1], 0) fi
	endfor
	outs = S[nInputs - 1][0]
	return outs

def mimc(field[2] ins) -> field:
	field nInputs = 2
	field nOutputs = 1
	field[2][2] S = [[0; 2]; 2] // Dim: (nInputs + nOutputs - 1, 2)

	for field i in 0..nInputs do
		field idx = if i == 0 then 0 else i - 1 fi
		S[i] = if i == 0 then MiMCFeistel(ins[0], 0, 0) else MiMCFeistel(S[idx][0] + ins[i], S[idx][1], 0) fi
	endfor
	return S[nInputs - 1][0]

def field_to_64bit(field i) -> bool[64]:
    bool[254] b = unpack(i)
    assert(b[0..190] == [false; 190])
    return b[190..254]

def verifyTrades(BalanceUpdate[${batchSize}] balances, field ethToToken, field tokenToEth) -> (field[3]):
	field boughtEth = 0
	field soldEth = 0
	field boughtToken = 0
	field soldToken = 0
	for field i in 0..${batchSize} do
		// assert(balances[i].oldNonce == balances[i].oldNonce) // makes sure the nonce is incremented
		field tradeDirection = if balances[i].oldEthAmount >= balances[i].newEthAmount then 0 else 1 fi
		field deltaEth = if tradeDirection == 0 then balances[i].oldEthAmount - balances[i].newEthAmount else balances[i].newEthAmount - balances[i].oldEthAmount fi
		field deltaToken = if tradeDirection == 0 then balances[i].newTokenAmount - balances[i].oldTokenAmount else balances[i].oldTokenAmount - balances[i].newTokenAmount fi
		boughtEth = if tradeDirection == 1 then boughtEth + deltaEth else boughtEth fi
		soldEth = if tradeDirection == 0 then soldEth + deltaEth else soldEth fi
		boughtToken = if tradeDirection == 0 then boughtToken + deltaToken else boughtToken fi
		soldToken = if tradeDirection == 1 then soldToken + deltaToken else soldToken fi
		// assert(ethToToken * deltaEth == 10000000000 * deltaToken && tradeDirection == 0 || 1000000000000 * deltaEth == tokenToEth * deltaToken && tradeDirection == 1)
	endfor
	//                                    +Eth, -Token | -Eth, +Token
	field direction = if boughtEth > soldEth then 1 else 0 fi
	field deltaEth = if direction == 1 then boughtEth - soldEth else soldEth - boughtEth fi
	field deltaToken = if direction == 0 then boughtToken - soldToken else soldToken - boughtToken fi
	return [direction, deltaEth, deltaToken]


def hashLeaf(BalanceUpdate balance) -> (field[2]):
	field[2] res = [0,0]
	field addrs = pack256(u32_8_to_bool_256([...balance.address, 0x00000000, 0x00000000, 0x00000000]))
	field temp = mimc_4([addrs, balance.oldEthAmount, balance.oldTokenAmount, balance.oldNonce])
	res[0] = temp
	temp = mimc_4([addrs, balance.oldEthAmount, balance.oldTokenAmount, balance.oldNonce])
	res[1] = temp
	return res
	
def hashFinalBalances(BalanceUpdate[${batchSize}] balances, field oldRoot, field newRoot, field ethToToken, field tokenToEth, field deltaEth, field deltaToken, field direction) -> (field[2]):
    bool[256] rootPrice = sha256_4(field_to_bool(oldRoot), field_to_bool(newRoot), [...field_to_64bit(ethToToken), ...field_to_64bit(tokenToEth), ...field_to_64bit(deltaEth), ...field_to_64bit(deltaToken)], field_to_bool(direction))
    bool[256] res = [false;256]
    for field i in 0..${batchSize} do
        bool[256] addrs = u32_8_to_bool_256([...balances[i].address, 0x00000000, 0x00000000, 0x00000000])
	    bool[256] amounts = [...field_to_64bit(balances[i].newEthAmount), ...field_to_64bit(balances[i].newTokenAmount), ...field_to_64bit(balances[i].newNonce), ...field_to_64bit(0)]
        res = sha256(res, sha256(addrs, amounts))
    endfor
    return [pack128(res[0..128]), pack128(res[128..256])]

def computeMerkle(field[${treeDepth}][2] merklePath, field leaf) -> (field):
	field computedHash = leaf
	for field i in 0..${treeDepth} do
		computedHash = if merklePath[i][1] == 0 then mimc([computedHash, merklePath[i][0]]) else mimc([merklePath[i][0], computedHash]) fi
	endfor
	return computedHash

def verifyLeaf(field[2] hashedLeaf, field[${treeDepth}][2] merklePath, field root) -> (field):
	field calcedRootField = computeMerkle(merklePath, hashedLeaf[0])
	assert(root == root) // old root can be reconstructed
	return computeMerkle(merklePath, hashedLeaf[1])
	
def verifyAndUpdateTree(BalanceUpdate[${batchSize}] balances, field root) -> (field[${batchSize + 1}]):
	field[${batchSize + 1}] newBalanceHashed = [0;${batchSize + 1}]
	for field i in 0..${batchSize} do
		field[2] hashedBalance = hashLeaf(balances[i])
		newBalanceHashed[i] = hashedBalance[1]
		root = verifyLeaf(hashedBalance, balances[i].merklePath, root)
	endfor
	newBalanceHashed[${batchSize}] = root
	return newBalanceHashed

def main(private BalanceUpdate[${batchSize}] balances, private field root, private field ethToToken, private field tokenToEth) -> (field[2]): //606828
// def main(private BalanceUpdate[3] balances, private field[2] root, private field ethToToken, private field tokenToEth) -> (field, field, field):
	field[3] netTrade = verifyTrades(balances, ethToToken, tokenToEth)
	field[${batchSize + 1}] rootAndBalancesHashes = verifyAndUpdateTree(balances, root)
	return hashFinalBalances(balances, ethToToken, tokenToEth, netTrade[0], netTrade[1], netTrade[2], root, rootAndBalancesHashes[${batchSize}])
`
}


function toEightBytesArray(leaf){
    let newLeaf = new Array();
    if(leaf.substring(0,2) == "0x") leaf = leaf.split("0x")[1]
    for(let i = 0; i < leaf.length; i += 8){
        newLeaf[i/8] = "0x" + leaf.substring(i, i + 8)
    }
    return newLeaf
}

function generateInputs(treeDepth, batchSize) {
    let res = []
    let merklePath = [];
    for(let i = 0; i < treeDepth; i++){
        if(i % 2 == 0) {
            merklePath.push(["0", "1"])
        } else {
            merklePath.push(["1", "0"])
        }
    }

    for(let i = 0; i < batchSize; i++) {
        if(i % 2 == 0) {
            res.push({
                oldEthAmount: "0",
                oldTokenAmount: "0",
                oldNonce: "0",
                newEthAmount: "1000000000000",
                newTokenAmount: "0",
                newNonce: "1",
                movementType: "0",
                address: toEightBytesArray("0x31b878918679d9DA1DB277B1A2fD67Aa01032920"),
                merklePath: merklePath
            })
        } else {
            res.push({
                oldEthAmount: "1000000000000",
                oldTokenAmount: "0",
                oldNonce: "0",
                newEthAmount: "0",
                newTokenAmount: "0",
                newNonce: "1",
                movementType: "1",
                address: toEightBytesArray("0x31b878918679d9DA1DB277B1A2fD67Aa01032920"),
                merklePath: merklePath
            })
        }
    }
    return "// echo " + `\"${JSON.stringify([res, "1111111"]).replace(/"/g, `\\"`)}\"` + " | ./memusg.sh zokrates compute-witness --light --abi --abi_spec ./abi.json --stdin >> console_log.txt";
}

  function generateInputs(treeDepth, batchSize) {
    let res = []
    let merklePath = [];
    for(let i = 0; i < treeDepth; i++){
        if(i % 2 == 0) {
            merklePath.push(["0", "1"])
        } else {
            merklePath.push(["1", "0"])
        }
    }
    for(let i = 0; i < batchSize; i++) {
        if(i % 2 == 0) {
            res.push({
                oldEthAmount: "0",
                oldTokenAmount: "0",
                oldNonce: "0",
                newEthAmount: "1000000000000",
                newTokenAmount: "0",
                newNonce: "1",
                address: toEightBytesArray("0x31b878918679d9DA1DB277B1A2fD67Aa01032920"),
                merklePath: merklePath
            })
        } else {
            res.push({
                oldEthAmount: "1000000000000",
                oldTokenAmount: "0",
                oldNonce: "0",
                newEthAmount: "0",
                newTokenAmount: "0",
                newNonce: "1",
                address: toEightBytesArray("0x31b878918679d9DA1DB277B1A2fD67Aa01032920"),
                merklePath: merklePath
            })
        }
    }
    return "// echo " + `\"${JSON.stringify([res, "1111111", "1234567856", "123723423"]).replace(/"/g, `\\"`)}\"` + " | ./memusg.sh zokrates compute-witness --light --abi --abi_spec ./abi.json --stdin >> console_log.txt";

  }

function generateBenchmarkingFiles(treeDepth, batchSize, dir) {
    let inputs = generateInputs(treeDepth, batchSize)
    let file = generateProgram(treeDepth, batchSize)
    let stream = fs.createWriteStream(dir + "/" +batchSize + "_" + treeDepth + ".zok");
    stream.once('open', function(fd) {
    stream.write(inputs);
    stream.write(file);
    stream.end();
    });
}

generateBenchmarkingFiles(16, 40, "trade16")
