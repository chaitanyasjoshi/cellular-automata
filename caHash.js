class CellularAutomaton1D {
  constructor() {
    this._CurrentState = [];
    this._NextState = [];
    this._Rule = 0;
    this._Key = this.stringToBinary(
      'thisisaverystronghashingkeynsdklfnskfbfuiebaajfbgndfjknkhawuhf'
    );
  }

  // Getters and setters
  get CurrentState() {
    return this._CurrentState;
  }
  get NextState() {
    return this._NextState;
  }
  get Rule() {
    return this._Rule;
  }
  set Rule(Rule) {
    this._Rule = Rule;
  }

  // Calculate value of curr bit based on CA rule and neighbourhood
  calculateBit(prev, curr, next) {
    return (this._Rule >> ((prev << 2) + (curr << 1) + (next << 0))) & 1;
  }

  calculateNextState() {
    for (let i = 0; i < this._CurrentState.length; i++) {
      let PrevIndex = i == 0 ? this._CurrentState.length - 1 : i - 1;
      let NextIndex = i == this._CurrentState.length - 1 ? 0 : i + 1;

      this._NextState[i] = this.calculateBit(
        this._CurrentState[PrevIndex],
        this._CurrentState[i],
        this._CurrentState[NextIndex]
      );
    }

    this._CurrentState = [...this._NextState];
    this._NextState.length = 0;
  }

  iterate(Iterations) {
    for (let Iteration = 1; Iteration <= Iterations; Iteration++) {
      this.calculateNextState();
    }
    return this.CurrentState;
  }

  hashCA(password) {
    // Convert password to binary
    const binaryPass = this.stringToBinary(password);

    // Add padding and convert string to integer array
    const padedPass = this.addPadding(binaryPass);
    const padedKey = this.addPadding(this._Key);

    // Apply desired cellular automata rule
    const processedPass = this.applyCARule(padedPass, 30);

    // Use transformation function
    console.log(
      this.binaryToHex(
        this.transform(processedPass, padedKey).toString().split(',').join('')
      )
    );
  }

  addPadding(msg) {
    return msg.length < 512
      ? (msg + '1' + '0'.repeat(512 - msg.length - 1)).split('')
      : msg.split('');
  }

  applyCARule(msg, rule) {
    this._CurrentState = msg;
    this._Rule = rule;
    return this.iterate(1000);
  }

  stringToBinary(input) {
    let characters = input.split('');

    return characters
      .map(function (char) {
        return char.charCodeAt(0).toString(2).padStart(8, 0);
      })
      .join('');
  }

  binaryToString(input) {
    return String.fromCharCode(
      ...input.match(/.{8}/g).map((byte) => parseInt(byte, 2))
    );
  }

  binaryToHex(input) {
    return input
      .match(/.{8}/g)
      .map((byte) => parseInt(byte, 2).toString(16))
      .toString()
      .split(',')
      .join('');
  }

  transform(msg, key) {
    // Make 8 blocks of 64bits from single block of 512 bits
    const blocks = [];
    const k = [];
    for (let i = 0; i < msg.length; i += 64) {
      blocks.push(msg.slice(i, i + 64));
      k.push(key.slice(i, i + 64));
    }
    for (let i = 0; i < k.length; i++) {
      console.log(k[i]);
    }

    // Transformation function step 1
    // a = e
    blocks[0] = [...blocks[4]];

    // *IMP* We are assuming that round is even
    // Transformation function step 2
    // b=J(g, h, K0) is used when the round number is odd
    // and b=J(g, h, K4) is used when the round number is
    // even.
    blocks[1] = this.j(blocks[6], blocks[7], k[4]);

    // Transformation function step 3
    // c=G(e, f, K1) or c=G(e, f, K5)
    // c=G(e, f, K1) is used when the round number is odd
    // and c=G(e, f, K5) is used when the round number is
    // even.
    blocks[2] = this.g(blocks[4], blocks[5], k[5]);

    // Transformation function step 4
    blocks[3] = this.f(blocks[0], blocks[2]);

    // Transformation function step 5
    // e=J(a, d ,K3) or e=J(a, d ,K7)
    // e=J(a, d ,K3) is used when the round number is odd
    // and e=J(a, d ,K7) is used when the round number is
    // even.
    blocks[4] = this.j(blocks[0], blocks[3], k[7]);

    // Transformation function step 6
    blocks[5] = this.h(blocks[1], blocks[3]);

    // Transformation function step 7
    blocks[6] = this.i(blocks[2], blocks[5]);

    // Transformation function step 8
    // h=H(a, K2) or h=H(a, K6)
    // h=H(a, K2) is used when the round number is odd and
    // h=H(c, K6) is used when the round number is even.
    blocks[7] = this.h(blocks[0], k[6]);

    return blocks.flat();
  }

  j(x, y, z) {
    return this.and(
      this.xor(this.rotn(x, 47), this.applyCARule(this.rotn(y, 37), 30)),
      this.rotn(z, 17)
    );
  }

  g(x, y, z) {
    return this.xor(
      this.or(this.applyCARule(this.applyCARule(x, 30), 134), y),
      this.and(this.applyCARule(z, 30), x)
    );
  }

  f(x, y) {
    return this.xor(this.applyCARule(x, 30), y);
  }

  h(x, y) {
    return this.xor(this.rotn(x, 17), this.rotn(y, 59));
  }

  i(x, y) {
    return this.xor(
      this.rotn(x, 41),
      this.applyCARule(this.applyCARule(this.rotn(y, 31), 30), 134)
    );
  }

  xor(x, y) {
    const xored = [];
    for (let i = 0; i < x.length; i++) {
      xored[i] = x[i] ^ y[i];
    }
    return xored;
  }

  and(x, y) {
    const and = [];
    for (let i = 0; i < x.length; i++) {
      and[i] = x[i] & y[i];
    }
    return and;
  }

  or(x, y) {
    const or = [];
    for (let i = 0; i < x.length; i++) {
      or[i] = x[i] | y[i];
    }
    return or;
  }

  /**
   * Rotates right (circular right shift) value x by n positions.
   */
  rotn(block, rightShifts) {
    return [
      ...block.slice(-rightShifts),
      ...block.slice(0, block.length - rightShifts),
    ];
  }
}

CA1D = new CellularAutomaton1D();
CA1D.hashCA('thisismypassword', 30);
