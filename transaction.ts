class TxOut {
  public address: string;
  public amount: number;

  constructor(address: string, amount: number) {
    this.address = address; // 주소는 ECDSA 퍼블릭키 값
    this.amount = amount;
  }
}

class TxIn {
  public txOutId: string;
  public txOutIndex: number;
  public signature: string;
}

class Transaction {
  public id: string;
  public txIns: TxIn[];
  public txOuts: TxOut[];
}
