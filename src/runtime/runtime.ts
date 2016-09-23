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

import * as events                from "events"
import {Argument}                 from "../parser/parse"
import {IWriter}                  from "../writer/writer"
import {create_watcher, IWatcher} from "../watcher/watcher"
import {create_server, IServer}   from "../server/server"

export interface IRuntime {
  on      (event: string,  func: Function)                         : IRuntime 
  on      (event: "data",  func: (data: [number, string]) => void) : IRuntime 
  on      (event: "error", func: (data: string) => void)           : IRuntime  
  on      (event: "end",   func: () => void)                       : IRuntime   
  start   () : void
  dispose () : void
}
class Runtime extends events.EventEmitter implements IRuntime {
  private state   : "pending" | "started" | "stopped"
  private watcher : IWatcher
  private server  : IServer
  
  /**
   * creates a new runtime.
   * @param {Argument} the command line argument.
   * @param {WritableStream} the output stream to pipe any process stdout / stderr.
   * @returns {IRuntime}
   */
  constructor(private argument: Argument, private writer: IWriter) {
    super()
    this.state   = "pending"
    this.watcher = undefined
    this.server  = undefined
  }

  /** 
   * starts this runtime.
   * @returns {void}
   */
  public start() : void {
    switch(this.state) {
      case "pending":
        this.state   = "started"

        //-------------------------------
        // initialize servr
        //-------------------------------
        this.server  = create_server({
          path: this.argument.path, 
          port: this.argument.port
        })
        this.server.on("request", request => {
          this.writer.write(`${request.method} ${request.url}\n`)
        })
        this.server.start()
        
        //-------------------------------
        // initialize watcher
        //-------------------------------
        this.watcher = create_watcher (this.argument.path, this.argument.timeout)
        this.watcher.on("data",   () => {
          this.writer.info("[reload]")
          this.server.reload()
        })
        this.watcher.on("error",  () => {})
        this.watcher.on("end",    () => {})
        this.watcher.start()
        break;
      default:
        this.emit("error", "a runtime can only be started once.")
        this.dispose()
        break;
    }
  }
  /** 
   * disposes this runtime and any processes.
   * @returns {void}
   */
  public dispose(): void {
    switch(this.state) {
      case "pending":
        this.state = "stopped"
        this.emit("end")
        break;
      case "started":
        this.state = "stopped"
        this.server.dispose()
        this.watcher.dispose()
        this.emit("end")
        break;
      case "stopped":
        break;
    }
  }
}

/**
 * creates a new runtime.
 * @param {Argument} the command line argument.
 * @param {WritableStream} the output stream to pipe any process stdout / stderr.
 * @returns {IRuntime}
 */
export function create_runtime(argument: Argument,  writer: IWriter) : IRuntime {
  return new Runtime(argument, writer)
}