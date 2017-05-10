/*--------------------------------------------------------------------------

fsweb - static http server with live reload.

The MIT License (MIT)

Copyright (c) 2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/



export interface IWriter {
  info  (buffer: string): void
  write (buffer: string): void
}
class Writer implements IWriter {
  private last : string
  /**
   * creates a new writer.
   * @param {WritableStream} the stream to write on.
   * @returns {IWriter}
   */
  constructor(private stream: NodeJS.WritableStream) {
    this.last = '\n'
  }
  /**
   * writes a informational message.
   * @param {string} the message to write.
   * @returns {void}
   */
  public info (buffer: string) : void {
    if(this.last === '\n') {
      this.stream.write(`\x1b[90m${buffer}\x1b[0m`)
      this.stream.write(`\n`)
    } else {
      this.stream.write(`\n`)
      this.stream.write(`\x1b[90m${buffer}\x1b[0m`)
      this.stream.write(`\n`)
    }
    this.last = '\n'
  }
  
  /**
   * writes a message.
   * @param {string} the message to write.
   * @returns {void}
   */
  public write(buffer: string) : void {
    this.last = buffer.length > 0 ? buffer.charAt(buffer.length - 1) : ''
    this.stream.write(buffer)
  } 
}

/**
 * creates a new writer.
 * @param {WritableStream} the stream to write on.
 * @returns {IWriter}
 */
export function create_writer(stream: NodeJS.WritableStream) : IWriter {
  return new Writer(stream)
}