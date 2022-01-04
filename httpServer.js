//httpSever.js

const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const { getBlocks, getVersion, nextBlock } = require('./chainedBlock')
const { addBlock } = require('./checkVaildBlock')
const { connectToPeers, getSockets } = require('./p2pServer')

const http_port = process.env.HTTP_PORT || 3001
//env | grep HTTP_PORT 는 포트를 확인하는것 node창에 실행명령어

function initHttpServer() {
  app.use(bodyParser.json())

  //6001은 내꺼 , 6002는 다른 노드라고 생각
  //curl -H "Content-tpye:application/json" --data "{\"data\": [\"ws://localhost:6002\",\"ws://localhost:6003\" ] }"
  //curl -H "Content-Type:application/json" --data "{\"data\": [\"ws://localhost:6002\",\"ws://localhost:6003\" ] }" http://localhost:3001/addPeers
  //curl -X GET http://localhost:3001/peers | python3 -m json.tool
  //curl -X GET http://localhost:3001/peers | python3 -m json.tool | grep _socket
  app.post('/addPeers', (req, res) => {
    const data = req.body.data || []
    //console.log(data);
    connectToPeers(data);
    res.send(data);
  })

  app.get('/peers', (req, res) => {
    let sockInfo = []
    getSockets().forEach(
      (s) => {
        sockInfo.push(s._socket.remoteAddress + ":" + s._socket.remotePort)
      }
    )
    res.send(sockInfo)
  })

  app.get("/blocks", (req, res) => {
    res.send(getBlocks())
  })

  app.post("/mineBlock", (req, res) => {
    const data = req.body.data || []
    //{"data": "HELLO COCO"}
    console.log(data);
    //블럭은 외부에서 만들고 검증만 하게 하려함 그 과정에서 엉킨 것.
    const block = nextBlock(data)
    addBlock(block)

    res.send(block)
  })

  app.get("/version", (req, res) => {
    res.send(getVersion())
  })

  app.post("/stop", (req, res) => {
    res.send({ "msg": "Stop Server!" })
    process.exit()
  })

  app.listen(http_port, () => {
    console.log("Listening Http Port : " + http_port)
  })
}

initHttpServer();

//curl -d '{"data":"HELLO"}' -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3001/mineblock

//curl -H "Content-Type: application/json" --data "{\"data\":[\"Anything1\",\"Anything2\"]}" http://localhost:3001/mineBlock
//curl -H "Content-Type: application/json" --data "{\"data\":[\"Anything1\",\"Anything2\"]}" http://localhost:3002/mineBlock

