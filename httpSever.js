//httpSever.js

const express = require("express")
const bodyParser = require("body-parser")
const { getBlocks, getVersion, nextBlock, addBlock } = require('./chainedBlock')
//const { addBlock } = require('./checkVaildBlock')

const http_port = process.env.HTTP_PORT || 3001
//env | grep HTTP_PORT 는 포트를 확인하는것 node창에 실행명령어

function initHttpServer() {
  const app = express()
  app.use(bodyParser.json())
  app.get("/blocks", (req, res) => {
    res.send(getBlocks())
  })

  app.post("/mineBlock", (req, res) => {
    const data = req.body.data || []
    //{"data": "HELLO COCO"}
    console.log(data);
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

