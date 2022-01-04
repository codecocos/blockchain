const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require('ws');
const { getLastBlock, getBlocks } = require('./chainedBlock');

//원장을 주고 받을 때, 거래참여자가 다수
//소켓이용해서 서버로 동작할 포트를 엶
function initP2PServer(test_port) {
  const server = new WebSocket.Server({ port: test_port })
  //console.log("server확인 :", server);
  server.on("connection", (ws) => { initConnection(ws); })
  console.log("Listening webSocket port:" + test_port);
}

initP2PServer(6001);
initP2PServer(6002);
initP2PServer(6003);

//접속할 소켓 저장
let sockets = []
function initConnection(ws) {
  sockets.push(ws)
  initMessageHandler(ws)
}

function getSockets() {
  return sockets;
}
//console.log("sockets 확인: ", sockets);

//메세지를 제이슨 형태로 전달 : 내가 가지고 있는 블록체인이 올바르지 않다, 너꺼 줘봐 해서 비교하고 내꺼가 틀리면 교체 등.
function write(ws, message) {
  ws.send(JSON.stringify(message))
}

// for (let i = 0; i < 10.; i++) {
//   arr[i] = i + 1;
// }

function broadcast(message) {
  // function (socket) {
  //   write(socket,message)
  // }
  ///////////////////////
  //위의 소켓함수와 같은 말
  sockets.forEach(
    (socket) => {
      write(socket, message);
    }
  )
}

function connectToPeers(newPeers) {
  newPeers.forEach(
    (peer) => {

      const ws = new WebSocket(peer)
      ws.on("open", () => {
        initConnection(ws)
        //console.log(peer)
      })
      ws.on("error", () => { console.log("connection Failed!"); })
    }
  )
}


//Message Handler
//다른 노드에서 메시지를 받을때의 받는 메시지 (메세지를 받아서 처리)
const MessageType = {
  QUERY_LATEST: 0, //데이터필드에 내 블럭 중 가장 최신블럭을 담아서
  QUERY_ALL: 1, //내 블럭체인 전체를 데이터에 담아서 회신
  RESPONSE_BLOCKCHAIN: 2 //하나이상으 블록을 가지고 메세지를 보낼때 기재
}

function initMessageHandler(ws) {
  ws.on("message", (data) => {
    const message = JSON.parse(data)

    switch (message.type) {
      case MessageType.QUERY_LATEST:
        write(ws, responseLatestMsg());
        break;
      case MessageType.QUERY_ALL:
        write(ws, responseAllChainMsg());
        break;
      case MessageType.RESPONSE_BLOCKCHAIN:
        handleBlockChainResponse(message);
        break;
    }
  })
}


function responseLatestMsg() {
  return ({
    "type": RESPONSE_BLOCKCHAIN,
    "data": JSON.stringify([getLastBlock()]) //제이슨으로 바꾸고 []로 형변환
  })
}

function responseAllChainMsg() {
  return ({
    "type": RESPONSE_BLOCKCHAIN,
    "data": JSON.stringify(getBlocks()) //제이슨으로 바꾸고, 이미 배열이니 형변환 필요없음
  })
}

//블럭을 받았을때, 
function handleBlockChainResponse() {

}

//요청을 보내는 함수 - http 에 넣어서 작동...
function queryAllMsg() {
  return ({
    "type": QUERY_ALL,
    "data": null
  })
}

function queryLatestMsg() {
  return ({
    "type": QUERY_LATEST,
    "data": null
  })
}


module.exports = { connectToPeers, getSockets }