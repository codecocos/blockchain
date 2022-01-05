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
// Message Handler
const MessageType = {
	QUERY_LATEST: 0,
	QUERY_ALL: 1,
	RESPONSE_BLOCKCHAIN: 2
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
		"data": JSON.stringify([getLastBlock()])
	})
}

function responseAllChainMsg() {
	return ({
		"type": RESPONSE_BLOCKCHAIN,
		"data": JSON.stringify(getBlocks())
	})
}

function handleBlockChainResponse(message) {
	const receiveBlocks = JSON.parse(message.data)
	const latestReceiveBlock = receiveBlocks[receiveBlocks.length - 1]
	const latestMyBlock = getLastBlock()

	//1. 데이터로 받은 블럭 중에 마지막 블럭의 인덱스가 내가 보유 중인 마지막 블럭의 인덱스보다 클 때 / 작을 때
	//내가 가진 것 보다 짧은 것은 의미가 없음
	if (latestReceiveBlock.header.index > latestMyBlock.header.index) {
		//받은 마지막 블록의 이전 해시값이 내 마지막 블럭일 때 : addBlock
		if (createHash(latestMyBlock) === latestReceiveBlock.header.previousHash) {
			if (addBlock(latestReceiveBlock)) {
				//나를 아는 주변 노드에게 변경사항을 전파
				//서로의 피어을 다 공유하고 있는 상황? 
				broadcast(responseLastestMsg())
			}
			else {
				console.log("Invaild Block!!");
			}
		}
		//받은 블럭의 전체 크기가 1일 때(제네시스 블럭 인 경우와 같다)
		else if (receiveBlocks.length === 1) {
			//블럭을 전체 다 달라고 요청하기
			broadcast(queryAllMsg())
		}
		else {
			//내 전체 블럭이 다른 블럭들보다 동기화가 안된 상황이므로 갈아끼우기
			//내 원장이랑 다른 원장들과의 차이가 매우 큰 경우 : 원장간의 불일치를 해소해야 하는 상황
			replaceChain(receiveBlocks)
		}
	}
	else {
		console.log("Do nothing.");
	}

}

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

function initErrorHandler(ws) {
	ws.on("close", () => { closeConnection(ws) })
	ws.on("error", () => { closeConnection(ws) })
}

function closeConnection(ws) {
	console.log(`Connection close${ws.url}`);
	//소켓을 복사하는 데, 뒤에 있는 데이터를 넣어서 복사 : 즉 , 초기화 하는 것임 
	sockets.splice(sockets.indexOf(ws), 1)
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

function initErrorHandler(ws) {
	ws.on("close", () => { closeConnection(ws) })
	ws.on("error", () => { closeConnection(ws) })
}

function closeConnection(ws) {
	console.log(`Connection close${ws.url}`);
	//소켓을 복사하는 데, 뒤에 있는 데이터를 넣어서 복사 : 즉 , 초기화 하는 것임 
	sockets.splice(sockets.indexOf(ws), 1)
}


module.exports = { connectToPeers, getSockets }
