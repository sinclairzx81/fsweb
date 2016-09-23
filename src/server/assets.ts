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

/**
 * returns the client signal script.
 * @returns {string}
 */
export function signal_script() : string {
  return `
window.addEventListener("load", function() {
  /**
   * handles incoming signals from the comet endpoint.
   * @param {string} the incoming signal.
   * @returns {void}
   */  
  function handler(signal) {
    switch(signal) {
      case "established": console.log("signals: established");  break;
      case "reload"     : window.location.reload(); break;
      case "ping"       : break;  
      case "disconnect":
        console.log("signals: disconnected");
        setTimeout(function() {
          console.log("signals: reconnecting...");
          connect(handler)
        }, 1000) 
        break;
    }
  }

  /**
   * connects to the comet endpoint and 
   * begins listening for incoming signals.
   * @param {Function} the signal handler.
   * @returns {void}
   */
  function connect(handler) {
    var xhr = new XMLHttpRequest();
    var idx = 0;
    xhr.addEventListener("readystatechange", function(event) {
      switch(xhr.readyState) {
        case 4: handler("disconnect"); break;
        case 3:
          var signal = xhr.response.substr(idx);
          idx += signal.length;
          handler(signal);
          break;
      }
    });
    xhr.open("GET", "/__signal", true); 
    xhr.send();
  }
  /**
   * connect
   */
  connect(handler)
})

`
}