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




import * as events        from "events"
import * as fs            from "fs"
import * as http          from "http"
import * as path          from "path"
import * as sys           from "../sys/sys"
import * as uuid          from "./uuid"
import * as mime          from "./mime"
import * as assets        from "./assets"


/** resource information interface. */
interface ResourceInfo {
  path: string
  type: "directory" | "file" | "notfound"
  mime: string
}

/**
 * returns information about the given resource. 
 * @param {string} the path to the resource.
 * @returns {ResourceInfo} 
 */
const resourceInfo = (path: string, callback: (info: ResourceInfo) => void) => {
  fs.stat(path, (error, stat) => {
    if(error) {
      callback({ 
        path: path,
        type: "notfound", 
        mime: mime.lookup(path) 
      })
    } else {
      callback({
        path: path, 
        type: stat.isDirectory() ? "directory" : "file", 
        mime: mime.lookup(path) 
      })
    }
  })
}

/** interface for request events. */
export interface RequestEvent {
  /** the url being requested */
  url    : string
  /** the http verb  */
  method : string
}

/** server initialization options. */
export interface IServerOptions {
  path : string
  port : number
}
/**
 * IServer:
 * encapsulates a simple static file server with live reload
 * functionality.
 */
export interface IServer {
  on      (event: string,    func: Function)                     : IServer 
  on      (event: "request", func: (data: RequestEvent) => void) : IServer
  start   (): void
  reload  (): void
  dispose (): void
}
class Server extends  events.EventEmitter implements IServer {
  private state       : "pending" | "started" | "stopped"
  private server      : http.Server
  private clients     : {[id: string]: http.ServerResponse}
  private ping_handle : NodeJS.Timer

  /**
   * creates a new process with the given command.
   * @param {string} the shell command.
   * @returns {Process}
   */
  constructor(private options: IServerOptions) {
    super()
    this.state       = "pending"
    this.server      = undefined
    this.clients     = {}
    this.ping_handle = undefined
  }

  /**
   * starts this server.
   * @returns {void}
   */
  public start() : void {
    switch(this.state) {
      case "pending":
        this.state  = "started"
        this.server =  http.createServer((req, res) => this.handler(req, res))
        this.server.listen(this.options.port)
        this.ping_handle = setInterval(() => this.handlePing(), 5000)
        break;
      default:
        this.emit("error", "a server can only be started once.")
        this.dispose()
        break;
    }
  }

  /**
   * emits a reload signal to any clients listening on the __signal endpoint.
   * @returns {void}
   */
  public reload(): void {
    switch(this.state) {
      case "started":
        Object.keys(this.clients).forEach(key => {
          this.clients[key].write("reload"); 
        })
        break;
      default: 
      break;
    }
  }
  
  /**
   * terminates and disposes this process.
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
          clearInterval(this.ping_handle)
          this.server.close()
          this.emit("end")
        break;
        case "stopped":
          break;
    }
  }
  
  /**
   * emits a ping signal to clients listening on the __signal endpoint.
   * @returns {void}
   */
  private handlePing() : void {
    switch(this.state) {
      case "started":
        Object.keys(this.clients).forEach(key => {
          this.clients[key].write("ping"); 
        })
        break;
      default: 
      break;
    }
  }

  /**
   * handles a http 404 error.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handle404(request: http.ServerRequest, response: http.ServerResponse, path: string): void {
    response.writeHead(404, {"Content-Type": "text/plain"})
    response.write("404 not found")
    response.end()
  }

  /**
   * handles a http 403 error. forbidden.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handle403(request: http.ServerRequest, response: http.ServerResponse, path: string): void {
    response.writeHead(403, {"Content-Type": "text/plain"})
    response.write("403 forbidden")
    response.end()
  }

  /**
   * processes a html document. Injecting content with the signal script.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @param {string} the path of the html document.
   * @returns {void}
   */
  private handleHtmlDocument(request: http.ServerRequest, response: http.ServerResponse, path: string, contentType: string) : void {
      response.writeHead(200, { "Content-Type":  contentType});
      fs.readFile(path, "utf8", (error, content) => {
          let script = '<script type="text/javascript" src="./__reload"></script>'
          content = [content, script].join("\n")
          response.end(content, "utf-8");
      })
  }

  /**
   * processes a file asset. 
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @param {string} the path of the asset.
   * @returns {void}
   */
  private handleFileAsset (request: http.ServerRequest, response: http.ServerResponse, path: string, contentType: string) : void {
    response.writeHead(200, { "Content-Type":  contentType});
    let readstream = fs.createReadStream(path)
    readstream.pipe(response)
  }

  /**
   * handles a signals client script request.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handleReloadScript(request: http.ServerRequest, response: http.ServerResponse) : void {
    response.writeHead(200, {"Content-Type": "text/javascript"})
    response.write(assets.reload_script())
    response.end()
  }

  /**
   * handles a signals client. creates a comet style long polling 
   * request, and adds the response to this servers client collection.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handleSignalClient(request: http.ServerRequest, response: http.ServerResponse) : void {
      response.setHeader('Connection',        "Transfer-Encoding")
      response.setHeader('Content-Type',      "text/html; charset=utf-8")
      response.setHeader('Transfer-Encoding', "chunked")
      response.setHeader("Cache-Control",     "no-cache, no-store, must-revalidate")
      response.setHeader("Pragma",            "no-cache")
      response.setHeader("Expires",           "0")
      response.statusCode = 200
      response.write    ("established")
      let id = uuid.u4();
      this.clients[id] = response;
      (<any>request).connection.on("close", () => {
        delete this.clients[id]
      })
  }

  /**
   * handles static content.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handleStatic(request: http.ServerRequest, response: http.ServerResponse): void {
    resourceInfo(sys.resolve_uri_path(this.options.path, request.url), info => {
      switch(info.type) {
        case "notfound": 
          this.handle404(request, response, info.path)
          break;
        case "directory":
          this.handle403(request, response, info.path)
          break;
        case "file":
          switch(info.mime) {
            case "text/html": 
              this.handleHtmlDocument(request, response, info.path, info.mime); 
              break;
            default:          
              this.handleFileAsset(request, response, info.path, info.mime); 
              break; 
          }
          break;
      }  
    })
  }

  /**
   * the http server handler.
   * @param {http.ServerRequest} the http request.
   * @param {http.ServerResponse} the http response.
   * @returns {void}
   */
  private handler(request: http.ServerRequest, response: http.ServerResponse): void {
    switch(request.url) {
      case "/__signal": 
        this.handleSignalClient(request, response)
        break;
      case "/__reload": 
        this.handleReloadScript(request, response)
        break;
      default:
        this.emit("request", { url: request.url, method: request.method })         
        this.handleStatic (request, response)    
        break;
    }
  }
}

/** 
 * creates a new fsweb server that watches the given directory and runs on the given port.
 * @param {string} the directory to watch.
 * @param {number} the port to listen on.
 * @returns {IServer}
 */
export function create_server(options: IServerOptions) : IServer {
  return new Server(options)
}