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

import * as fs     from "fs"
import * as path   from "path"
import * as events from "events"
import * as os     from "os"

/** semi unified linux watcher. */
export class LinuxWatcher implements fs.FSWatcher {
  constructor(private watchers: fs.FSWatcher[]) {}
  public addListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public addListener(event: "error", listener: (code: number, signal: string) => void): this;
  public addListener(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.addListener(event, listener))
    return this
  }
  public removeListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public removeListener(event: "error", listener: (code: number, signal: string) => void): this;
  public removeListener(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.addListener(event, listener))
    return this
  }
  public removeAllListeners(event?: string | symbol) : this {
    this.watchers.forEach(watcher => watcher.removeAllListeners())
    return this
  }
  public on(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public on(event: "error", listener: (code: number, signal: string) => void): this;
  public on(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.on(event, listener))
    return this
  }
  public once(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public once(event: "error", listener: (code: number, signal: string) => void): this;
  public once(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.once(event, listener))
    return this
  }
  public prependListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public prependListener(event: "error", listener: (code: number, signal: string) => void): this;
  public prependListener(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.prependListener(event, listener))
    return this
  }
  public prependOnceListener(event: "change", listener: (eventType: string, filename: string | Buffer) => void): this;
  public prependOnceListener(event: "error", listener: (code: number, signal: string) => void): this;
  public prependOnceListener(event: string, listener: Function): this {
    this.watchers.forEach(watcher => watcher.prependOnceListener(event, listener))
    return this
  }
  public setMaxListeners(n: number): this {
    this.watchers.forEach(watcher => watcher.setMaxListeners(n))
    return this
  }
  public getMaxListeners(): number {
    return (this.watchers.length === 0) ? 0: this.watchers[0].getMaxListeners()
  }
  public listeners(event: string | symbol): Function[] {
    return (this.watchers.length === 0) ? [] : this.watchers[0].listeners(event)
  }
  public emit(event: string | symbol, ...args: any[]): boolean {
    return false
  }
  public eventNames(): (string | symbol)[] {
     return (this.watchers.length === 0) ? [] : this.watchers[0].eventNames()
  }
  public listenerCount(type: string | symbol): number {
    return (this.watchers.length === 0) ? 0 : this.watchers[0].listenerCount(type)
  }
  public close() {
    this.watchers.forEach(watcher => watcher.close())
  }
}

/** recursively builds a directory list to be watched. */
const directoryWatchList = (directoryPath: string, buffer: string[] = []) => {
  buffer.push(directoryPath)
  const contents = fs.readdirSync(directoryPath)
  const records  = contents.map(content => ({
    path: path.join(directoryPath, content),
    stat: fs.statSync(path.join(directoryPath, content))
  })).filter(record => record.stat.isDirectory())
  records.forEach(record => directoryWatchList(record.path, buffer))
  return buffer
}

/** implementation of fs watch for linux handling. */
export const watch = (filePath: string, options: { persistent?: boolean; recursive?: boolean; encoding?: string }, listener?: (event: string, filename: string) => any): fs.FSWatcher => {
  if(os.platform() !== "linux"){
    return fs.watch(filePath, options, listener)
  } else {
    options.encoding   = options.encoding   || "utf8"
    options.persistent = options.persistent || true
    options.recursive  = options.recursive  || false
    // how to check exists again?
    const stat = fs.statSync(filePath)
    if(stat.isFile()) {
      return fs.watch(filePath, options, listener)
    } else if(stat.isDirectory()) {
      if(!options.recursive) {
        return fs.watch(filePath, options, listener)
      } else {
        const directories = directoryWatchList(filePath)
        const watchers    = directories.map(directory => fs.watch(directory, options, listener))
        return new LinuxWatcher(watchers)
      }
    } else {
      throw Error("not a file or directory.")
    }
  }
}