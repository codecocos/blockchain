const p2p_port = process.env.P2P_PORT || 6001

const WebSocket = require('ws')

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



module.exports = { connectToPeers, getSockets }