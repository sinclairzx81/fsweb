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



import * as npath from "path"
import * as fs    from "fs"
import * as url   from "url"

/**
 * checks if the file or directory path exists.
 * @param {string} the path.
 * @returns {boolean}
 */
export function path_exists(path: string) : boolean {
  try {
    return fs.statSync(path) !== null  
  } catch(e) {
    return false
  }
}

/**
 * resolves this path from the current working directory.
 * @param {string} the path to resolve.
 * @returns {string}
 */
export function resolve_path(path: string) : string {
  return npath.resolve(process.cwd(), path)
}

/**
 * for the given directory and url, resolve the path to a resource.
 * @param {string} the directory to resolve from.
 * @param {string} the incoming url.
 * @returns {string} the path to the requested resource.
 */
export function resolve_uri_path  (directory: string, request_url: string) : string {
    let resolved = npath.resolve("./", directory) + "\\"
    let safeurl  = request_url.replace(new RegExp("\\.\\.", 'g'), "");
    let uri      = url.parse(safeurl)
    let resource = npath.join(resolved, uri.pathname)
    resource     = resource.replace(new RegExp("\\\\", 'g'), "/");
    if(resource.lastIndexOf("/") === (resource.length - 1))
      resource = resource + "index.html"
    resource = npath.normalize(resource)
    return resource
}
