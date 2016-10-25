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

/** fsweb argument. */
export interface Argument {
  /** the directory to watch / serve */
  path      : string,
  /** the port to listen on */
  port      : number,
  /** default timeout inbetween refresh */
  timeout   : number
}

/**
 * validates if the input is a numeric string, and its within a numberic port range.
 * @param {string} the input to test.
 * @returns {boolean}
 */
function validate_port(input: string) : boolean {
  let numeric = +input
  if(numeric === NaN) 
    return false
  let test = parseInt(input)
  return (test > 0 && test < 65536)
}

/**
 * validates if the input is a string.
 * @param {string} the input to test.
 * @returns {boolean}
 */
function validate_path  (input: string) : boolean {
  return typeof input === "string"
}

/*
 * for the given process.argv array, extract the arguments
 * as a string value.
 * @param {string[]} the value from process.argv
 * @returns {Result<string>}
 */
function extract_input(argv: string[]) : string {
  let process = argv.shift()
  let script  = argv.shift()
  let line    = argv.join(' ')
  return line
}


/**
 * resolves the paths from the given input string. If 
 * no paths is given, then resolve to cwd (denoted by ./)
 * @param {string} the input line.
 * @returns {Result<string>} 
 */
function extract_path(input: string) : string {
  let split = input.split(" ").map(n => n.trim()).filter(n => n.length > 0)
  let path  = undefined
  if(split.length === 0) {
    path = "./"
  }
  else if (split.length >= 1) {
    if(validate_path(split[0])) {
      path = split[0]
    } else {
      throw Error("invalid path")
    }
  }
  return path
}

/**
 * extracts the port number from the input. (defaults to 5000 if not found)
 * @param {string} the input
 * @returns {number} the port.
 */
function extract_port(input: string) : number {
  let split = input.split(" ").map(n => n.trim()).filter(n => n.length > 0)
  let port  = undefined
  if(split.length === 0) {
    port = "5000"
  }
  else if (split.length === 1) {
    if(validate_port(split[0])) {
      port = split[0]
    } else {
      port = "5000"
    }
  }
  else if (split.length >= 2) {
    if(validate_port(split[1])) {
      port = split[1]
    } else {
      throw Error("invalid port")
    }
  } return parseInt(port)
}

/**
 * parses the given process.argv array into argument.
 * @param {string[]} the process.argv array.
 * @returns {Result<Argument>}
 */
export function parse_argument(argv: string[]) : Argument {
  let input = extract_input(argv)
  return {
    path     : extract_path(input),
    port     : extract_port(input), 
    timeout  : 100
  }
}