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

/// <reference path="typings/node/node.d.ts" />

import {resolve_path, path_exists} from "./sys/sys"
import {parse_argument}            from "./parser/parse"
import {create_writer}             from "./writer/writer"
import {create_server}             from "./server/server"
import {create_watcher}            from "./watcher/watcher" 
import {create_runtime}            from "./runtime/runtime" 

(() => {   
  let writer = create_writer(process.stdout)

  try {
    //-----------------------------------------
    // extract argument.
    //-----------------------------------------
    let argument   = parse_argument(process.argv)

    //-----------------------------------------
    // validate path.
    //-----------------------------------------
    if(path_exists(argument.path) === false)
        throw Error("no such file or directory.")
    
    //-----------------------------------------
    // start runtime and pipe to stdout.
    //-----------------------------------------
    writer.info(`[watching: ${argument.path} on port ${argument.port}]`)
    let runtime   = create_runtime(argument, writer)
    runtime.start()
    
  } catch(e) {
    writer.write(e.message + "\n")
  }
})()




  
  