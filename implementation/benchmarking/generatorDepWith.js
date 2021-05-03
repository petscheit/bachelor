const fs = require('fs');

function generateProgram(treeDepth, batchSize) {
    return `
import "hashes/sha256/embed/512bitPadded" as sha256
import "utils/pack/bool/pack256.zok" as pack256
import "utils/pack/bool/nonStrictUnpack256.zok" as field_to_bool
import "utils/casts/u32_8_to_bool_256.zok" as u32_8_to_bool_256
import "hashes/mimcSponge/mimcFeistel" as MiMCFeistel
import "utils/pack/bool/pack128.zok" as pack128
import "EMBED/unpack" as unpack

struct BalanceMovementObject {
    field oldEthAmount
    field oldTokenAmount
    field oldNonce
    field newEthAmount
    field newTokenAmount
    field newNonce
    field movementType // 0: deposit, 1: withdraw
    u32[5] address
    field[${treeDepth}][2] merklePath
    field deltaEth
    field deltaToken
}

def field_to_64bit(field i) -> bool[64]:
    bool[254] b = unpack(i)
    assert(b[0..190] == [false; 190])
    return b[190..254]

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

def hashLeaf(BalanceMovementObject balance) -> (field[2]):
    field[2] res = [0,0]
    field addrs = pack256(u32_8_to_bool_256([...balance.address, 0x00000000, 0x00000000, 0x00000000]))
    field temp = mimc_4([addrs, balance.oldEthAmount, balance.oldTokenAmount, balance.oldNonce])
    res[0] = temp
    temp = mimc_4([addrs, balance.oldEthAmount, balance.oldTokenAmount, balance.oldNonce])
    res[1] = temp
    return res

def verifyDepWith(BalanceMovementObject[${batchSize}] balances) -> (bool):
    for field i in 0..${batchSize} do
        assert(balances[i].oldNonce == balances[i].newNonce - 1) // makes sure the nonce is incremented
        assert(balances[i].newEthAmount >= 0)
        assert(balances[i].oldEthAmount >= 0)
        assert(balances[i].newTokenAmount >= 0)
        assert(balances[i].oldTokenAmount >= 0)
    endfor
    return true
    
def hashFinalBalances(BalanceMovementObject[${batchSize}] balances, field oldRoot, field newRoot) -> (field[2]):
    bool[256] res = sha256(field_to_bool(oldRoot), field_to_bool(newRoot))
    bool[256] depHash = [false; 256]
    for field i in 0..${batchSize} do
        bool[256] val = if balances[i].deltaEth > 0 then [...u32_4_to_bool_128(balances[i].address[0..4]), ...u32_to_bits(balances[i].address[4]), ...field_to_64bit(balances[i].deltaEth), ...[true;32]] else [...u32_4_to_bool_128(balances[i].address[0..4]), ...u32_to_bits(balances[i].address[4]), ...field_to_64bit(balances[i].deltaToken), ...[false;32]] fi
        depHash = if balances[i].movementType == 0 then sha256(depHash, val) else depHash fi
        bool[256] addrs = u32_8_to_bool_256([...balances[i].address, 0x00000000, 0x00000000, 0x00000000])
	    bool[256] amounts = [...field_to_64bit(balances[i].newEthAmount), ...field_to_64bit(balances[i].newTokenAmount), ...field_to_64bit(balances[i].newNonce), ...field_to_64bit(0)]
        res = sha256(res, sha256(addrs, amounts))
    endfor
	res = sha256(res, depHash)
    return [pack128(res[0..128]), pack128(res[128..256])]

def computeMerkle(field[${treeDepth}][2] merklePath, field leaf) -> (field):
    field computedHash = leaf
    for field i in 0..${treeDepth} do
        computedHash = if merklePath[i][1] == 0 then mimc([computedHash, merklePath[i][0]]) else mimc([merklePath[i][0], computedHash]) fi
    endfor
    return computedHash

def verifyLeaf(field[2] hashedLeaf, field[${treeDepth}][2] merklePath, field root) -> (field):
    field calcedRootField = computeMerkle(merklePath, hashedLeaf[0])
    assert(1 == 1) // would check for same merkle if not benchmarking here
    return computeMerkle(merklePath, hashedLeaf[1])
    
def verifyAndUpdateTree(BalanceMovementObject[${batchSize}] balances, field root) -> (field[${batchSize + 1}]):
    field[${batchSize + 1}] newBalanceHashed = [0;${batchSize + 1}]
    for field i in 0..${batchSize} do
        field[2] hashedBalance = hashLeaf(balances[i])
        newBalanceHashed[i] = hashedBalance[1]
        root = verifyLeaf(hashedBalance, balances[i].merklePath, root)
    endfor
    newBalanceHashed[${batchSize}] = root
    return newBalanceHashed

def main(private BalanceMovementObject[${batchSize}] balances, private field root) -> (field[2]): //606828
    assert(verifyDepWith(balances) == true)
    field[${batchSize + 1}] rootAndBalancesHashes = verifyAndUpdateTree(balances, root)
    return hashFinalBalances(balances, root, rootAndBalancesHashes[${batchSize}])
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
                merklePath: merklePath,
                deltaEth: "0",
                deltaToken: "0"
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
                merklePath: merklePath,
                deltaEth: "1",
                deltaToken: "0"
            })
        }
    }
    return "// echo " + `\"${JSON.stringify([res, "1111111"]).replace(/"/g, `\\"`)}\"` + " | ./memusg.sh zokrates compute-witness --light --abi --abi_spec ./abi.json --stdin >> console_log.txt";
}

// [[1000000, 0, 1,"0x31b878918679d9DA1DB277B1A2fD67Aa01032920", 0, 0], [0,0,1,"0x31b878918679d9DA1DB277B1A2fD67Aa01032920", 10000000, 0],[1000000, 0, 1,"0x31b878918679d9DA1DB277B1A2fD67Aa01032920", 0, 0]]

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

generateBenchmarkingFiles(16, 35, "depWith16")
