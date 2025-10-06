// Name: Scbackend SDK
// ID: scbackendsdk
// Description: SDK for Scbackend
// By: XQYWorld
// Original: FurryR
// License: MPL-2.0

(() => {
  // src/l10n/index.js
  var l10n_default = {
    zh: {
      "scbackendsdk.connect": "\u8FDE\u63A5\u5230 [remaddr] \u670D\u52A1\u5668\u4E0A\u7684 [instname] \u5B9E\u4F8B",
      "scbackendsdk.connectwait": "\u8FDE\u63A5\u5230 [remaddr] \u670D\u52A1\u5668\u7684 [instname] \u5B9E\u4F8B \u5E76\u7B49\u5F85\u8FDE\u63A5\u5B8C\u6210",
      "scbackendsdk.disconnect": "\u65AD\u5F00\u8FDE\u63A5",
      "scbackendsdk.isconnected": "\u5DF2\u8FDE\u63A5\uFF1F",
      "scbackendsdk.send": "\u53D1\u9001\u6D88\u606F [msg]",
      "scbackendsdk.whenmessage": "\u5F53\u6536\u5230\u6D88\u606F",
      "scbackendsdk.getmsg": "\u6536\u5230\u7684\u6D88\u606F"
    },
    en: {
      "scbackendsdk.connect": "Connect to [remaddr] server [instname] instance",
      "scbackendsdk.connectwait": "Connect to [remaddr] server [instname] instance and wait",
      "scbackendsdk.disconnect": "Disconnect",
      "scbackendsdk.isconnected": "Is connected?",
      "scbackendsdk.send": "Send message [msg]",
      "scbackendsdk.whenmessage": "When message received",
      "scbackendsdk.getmsg": "Received message"
    }
  };

  // src/index.js
  (function(Scratch2) {
    if (Scratch2.extensions.unsandboxed === false) {
      throw new Error("Sandboxed mode is not supported");
    }
    const translate = function(key) {
      const locale = globalThis.navigator.language.slice(0, 2);
      if (l10n_default[locale] && l10n_default[locale][key]) {
        return l10n_default[locale][key];
      } else {
        return l10n_default["en"][key] || key;
      }
    };
    class ScbackendSDK {
      constructor() {
        this.ws = null;
        this.isopened = false;
      }
      getInfo() {
        return {
          id: "scbackendsdk",
          name: "Scbackend SDK",
          blocks: [
            {
              blockType: Scratch2.BlockType.COMMAND,
              opcode: "connect",
              text: translate("scbackendsdk.connect"),
              arguments: {
                remaddr: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "ws://localhost:3031"
                },
                instname: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "test"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.COMMAND,
              opcode: "connectwait",
              text: translate("scbackendsdk.connectwait"),
              arguments: {
                remaddr: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "ws://localhost:3031"
                },
                instname: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "test"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.COMMAND,
              opcode: "disconnect",
              text: translate("scbackendsdk.disconnect")
            },
            {
              blockType: Scratch2.BlockType.BOOLEAN,
              opcode: "isconnected",
              text: translate("scbackendsdk.isconnected")
            },
            {
              blockType: Scratch2.BlockType.COMMAND,
              opcode: "send",
              text: translate("scbackendsdk.send"),
              arguments: {
                msg: {
                  type: Scratch2.ArgumentType.STRING,
                  defaultValue: "Hello, world!"
                }
              }
            },
            {
              blockType: Scratch2.BlockType.EVENT,
              opcode: "whenmessage",
              text: translate("scbackendsdk.whenmessage"),
              isEdgeActivated: false
            },
            {
              blockType: Scratch2.BlockType.REPORTER,
              opcode: "getmsg",
              text: translate("scbackendsdk.getmsg")
            }
          ],
          menus: {
            blockMenu: {
              acceptReporters: true,
              items: [{ text: translate("scbackendsdk.connect.wait"), value: true }, { text: translate("scbackendsdk.connect.dontwait"), value: false }]
            }
          }
        };
      }
      _doconnect(remaddr, dst, util, resolve, reject) {
        this.ws = new WebSocket(remaddr);
        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({ type: "handshake", dst: dst.toString() }));
        };
        this.ws.onmessage = (event) => {
          const msg = event.data;
          const data = JSON.parse(msg);
          if (data.type === "handshake" && data.status === "ok") {
            this.isopened = true;
            this.sessionid = data.sessionId;
            if (resolve) resolve();
          } else if (data.type === "message") {
            util.startHats("scbackendsdk_whenmessage").forEach((t) => {
              t.initParams();
              t.pushParam("data", data.message);
            });
          }
        };
        this.ws.onclose = (event) => {
          this.ws = null;
          this.isopened = false;
          if (reject) reject(event);
        };
        this.ws.onerror = (error) => {
          if (reject) reject(error);
        };
      }
      connect(args, util) {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
          this.isopened = false;
        }
        this._doconnect(args.remaddr, args.instname, util);
      }
      async connectwait(args, util) {
        await new Promise((resolve, reject) => {
          this._doconnect(args.remaddr, args.instname, util, resolve, reject);
        });
      }
      disconnect() {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
          this.isopened = false;
        }
      }
      isconnected() {
        return this.isopened;
      }
      send(args) {
        if (this.ws && this.isopened) {
          this.ws.send(JSON.stringify({ type: "message", body: args.msg }));
        }
      }
      getmsg(_args, util) {
        return util.thread.getParam("data") || "";
      }
    }
    Scratch2.extensions.register(new ScbackendSDK());
  })(Scratch);
})();
