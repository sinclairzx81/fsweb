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

/// <reference path="../typings/node/node.d.ts" />
import * as events  from "events"
import * as fs      from "fs"


/**
 * Debounce:
 * 
 * file system watch debouncer. limits the 
 * amount of events emitted from a file
 * system watcher.
 */
class Debounce {
  private handle : NodeJS.Timer
  constructor(private delay: number) {
    this.handle = undefined
  }
  /**
   * runs the given function. If the function
   * is called before this debouncers delay
   * has elapsed, the event is rerun.
   * @param {Function} the function to run.
   * @returns {void}
   */
  public set(func: Function): void {
    if(this.handle !== undefined) {
      clearTimeout(this.handle)
    }
    this.handle = setTimeout(() => {
      func(); this.handle = undefined;
    }, this.delay)
  }
}

export interface IWatcher {
  on      (event: string,  func: Function)                         : IWatcher 
  on      (event: "data",  func: (data: [string, string]) => void) : IWatcher 
  on      (event: "error", func: (data: string) => void)           : IWatcher  
  on      (event: "end",   func: () => void)                       : IWatcher 
  start   () : void
  dispose () : void
}
class Watcher extends events.EventEmitter implements IWatcher {
  private state       : "pending" | "started" | "stopped"
  private watcher     : fs.FSWatcher
  private debounce    : Debounce
  /**
   * creates a new watcher.
   * @param {string} the path of the file or directory to watch.
   * @param {number} the timeout in milliseconds to wait before restart.
   * @returns {IWatcher}
   */
  constructor(public path: string, private timeout: number) {
    super() 
    this.state    = "pending"
    this.watcher  = null
    this.debounce = new Debounce(timeout)
  }
  /**
   * starts this watcher.
   * @returns {void}
   */
  public start() : void {
    switch(this.state) {
      case "pending": {
        this.state = "started"
        let options  = {recursive: true}
        this.watcher = fs.watch(this.path, options, (event, filename) => {
          this.debounce.set(() => {
            this.emit("data", [event, filename])
          })
        }); 
        break;
      }
      default:
        this.emit("error", "cannot start a watcher more than once")
        this.dispose()
        break;
    }
  }
  /**
   * disposes this watcher.
   * @returns {void}
   */
  public dispose() : void {
    switch(this.state) {
      case "pending":
        this.state = "stopped"
        this.emit("end")
        break;
      case "started":
        this.state = "stopped"
        this.watcher.removeAllListeners()
        this.watcher.close()
        this.emit("end")
        break;
      case "stopped":
        break;
    }
  }
}
/**
 * creates a new watcher.
 * @param {string} the path of the file or directory to watch.
 * @param {number} the timeout in milliseconds to wait before restart.
 * @returns {IWatcher}
 */
export function create_watcher(path: string, timeout: number) : IWatcher {
  return new Watcher(path, timeout)
}