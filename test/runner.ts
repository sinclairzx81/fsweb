//-------------------------------------
// ultra lightweight test runner.
// sinclair 
//-------------------------------------
declare var process: any;
declare class Promise {
    constructor(resolver: (resolve: Function, reject: Function) => void) 
    then(continuation: any) : Promise
    catch(continuation: any) : Promise
    static resolve(value: any): Promise
}
//-------------------------------------------
// environment
//-------------------------------------------
module environment {
    type Platform = "unknown" | "node" | "browser"
    let _platform: Platform = "unknown"
    let _buffer  : string[] = []

    export function platform() : Platform {
        if(_platform === "unknown") {
            try {
                let _ = process
                _platform = "node"
            } catch(e) {
                _platform = "browser"
            }
        } return _platform
    }
    export function newline() {
        switch(platform()) {
            case "node":    process.stdout.write("\n"); break;
            case "browser": console.log(_buffer.join('')); _buffer = []; break;
        }
    }
    export function write(message: string) {
        switch(platform()) {
            case "node":    process.stdout.write(message); break;
            case "browser": _buffer.push(message); break;
        }
    }
}

//-------------------------------------------
// logging
//-------------------------------------------
module log {
    export function newline () {
        environment.newline()
    }
    export function write (message: string) : void {
        environment.write('\x1b[0m')
        environment.write(message)
        environment.write('\x1b[0m')
    }
    export function info (message: string) : void {
        environment.write('\x1b[33m')
        environment.write(message)
        environment.write('\x1b[0m')
    }
    export function ok (message: string) : void {
        environment.write('\x1b[32m')
        environment.write(message)
        environment.write('\x1b[0m')
    }
    export function fail (message: string) : void {
        environment.write('\x1b[31m')
        environment.write(message)
        environment.write('\x1b[0m')
    }
}
//-------------------------------------------
// test context
//-------------------------------------------
export interface Context {
    assert  (reason: string, value: boolean) : void
    assert  (value: boolean) : void
    ok      (): void
}
//-------------------------------------------
// tests
//-------------------------------------------
const tests  = new Array<(next: Function) => void>()

//-------------------------------------------
// add a test.
//-------------------------------------------
export function test(reason: string, func: (context: Context) => void) : void {
    tests.push(next => {
        try {   
            let done = false
            log.info("running ")
            log.write(reason)
            log.write(" ")
            func({
                assert: (...args: any[]) => {
                    if(done === true) return
                    let [reason, assertion] = (args.length === 2) 
                        ? [args[0], args[1]] 
                        : (args.length === 1) 
                            ? ["failed", args[0]] 
                            : ["failed", false]
                    if(assertion === false) {
                        done = true
                        log.fail(reason)
                        log.newline()
                        next(false)
                    }
                },
                ok: () => {
                    if(done === true) return
                    done = true
                    log.ok("ok") 
                    log.newline()
                    next(true)
                }
            })
        } catch(e)  {
            log.fail(e.message)
            log.newline()
            next(false)
        }
    })
}
//-------------------------------------------
// runs em.
//-------------------------------------------
export function run(): Promise {
    return tests.reduce((promise, test) => {
        return promise.then(value  => new Promise((resolve, _) => {
            test(result => {
                resolve({
                    ok  : result ? value.ok + 1: value.ok,
                    fail: result ? value.fail  : value.fail + 1
                })   
            })
        }))  
    }, Promise.resolve({ok: 0, fail: 0})).then(result => {
        log.ok  ("         " + result.ok.toString()   + " passed");   log.newline()
        log.fail("         " + result.fail.toString() + " failed"); log.newline()
        return result
    })
}