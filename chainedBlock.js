const cryptoJs = require('crypto-js')
const fs = require('fs')
const merkle = require('merkle')

//블록 구조체 선언 : 헤더, 바디
class Block {
  constructor(header, body) {
    this.header = header
    this.body = body
  }
}

//블록헤더 구조체 선언 : 헤더 구성 요소 나열
class BlockHeader {
  constructor(index, version, previousHash, timestamp, merkleRoot, bit, nonce) {
    this.index = index
    this.version = version
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.merkleRoot = merkleRoot
    this.bit = bit
    this.nonce = nonce
  }
}

function getVersion() {
  const package = fs.readFileSync('package.json')
  //console.log(JSON.parse(package).version)
  return JSON.parse(package).version
}

function createGenesisBlock() {
  const index = 0
  const version = getVersion()
  const previousHash = '0'.repeat(64) // 0을 64번 반복
  const timestamp = parseInt(Date.now() / 1000) // 1000 나눈 이유 : 초 단위로 환산하기 위해
  const body = ['Hello block!']
  const tree = merkle('sha256').sync(body)
  const merkleRoot = tree.root() || '0'.repeat(64)
  const bit = 0
  const nonce = 0

  // console.log("version : %s, timestamp : %d, body: %s", version, timestamp, body);
  // console.log("previousHash : %d", previousHash);
  // console.log(tree);
  // console.log("merkleRoot: %s", merkleRoot);

  const header = new BlockHeader(index, version, previousHash, timestamp, merkleRoot, bit, nonce)
  return new Block(header, body)
}

// const block = createGenesisBlock()
// console.log(block);

let Blocks = [createGenesisBlock()]

function getBlocks() {
  return Blocks
}

function getLastBlock() {
  return Blocks[Blocks.length - 1]
}

function createHash(data) {
  const { index, version, previousHash, timestamp, merkleRoot, bit, nonce } = data.header

  const blockString = index + version + previousHash + timestamp + merkleRoot + bit + nonce

  const hash = cryptoJs.SHA256(blockString).toString()
  return hash
}

// //제네시스 블럭생성
// const block = createGenesisBlock()
// //제네시스 블럭의 해쉬값
// const testHash = createHash(block)
// console.log(testHash);

function nextBlock(bodyData) {
  const prevBlock = getLastBlock()
  const version = getVersion()
  const index = prevBlock.header.index + 1
  const previousHash = createHash(prevBlock)
  const timestamp = parseInt(Date.now() / 1000)
  const tree = merkle('sha256').sync(bodyData)
  const merkleRoot = tree.root() || '0'.repeat(64)
  const bit = 0
  const nonce = 0

  const header = new BlockHeader(index, version, previousHash, timestamp, merkleRoot, bit, nonce)
  return new Block(header, bodyData)
}

// const block1 = nextBlock(['transaction1'])
// console.log(block1);

function addBlock(bodyData) {
  const newBlock = nextBlock(bodyData)
  Blocks.push(newBlock)

}

addBlock(['transaction1'])
addBlock(['transaction2'])
addBlock(['transaction3'])
addBlock(['transaction4'])
addBlock(['transaction5'])
console.log(Blocks);

module.exports = { nextBlock, getLastBlock, createHash, Blocks, getVersion, getBlocks }