import {isEqual} from "lodash-es";

export default class History {
  private buffer: Array<any> = [];
  private indexOffset: number = 0;

  public get length(): number {
    return this.buffer.length;
  }

  public push(value: any) {
    const top = this.buffer[this.buffer.length - 1];
    if (isEqual(value, top)) {
      return;
    }

    this.buffer.push(value);
    if (this.indexOffset != 0) {
      this.decrementIndex();
    }
  }

  public getCurrentValue(): any {
    return this.buffer[this.currentIndex()];
  }

  public decrementIndex() {
    if (Math.abs(this.indexOffset) < this.buffer.length) {
      this.indexOffset = Math.max(this.indexOffset - 1, 1 - this.length);
    }
  }

  public incrementIndex() {
    if (this.indexOffset != 0) {
      this.indexOffset += 1;
    }
  }

  public currentIndex(): number {
    return this.buffer.length + this.indexOffset - 1;
  }
}
