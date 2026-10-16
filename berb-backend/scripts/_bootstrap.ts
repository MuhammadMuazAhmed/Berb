// tsx runs outside Next, so stub the "server-only" guard module.
import Module from "node:module";
const orig = (Module as any)._load;
(Module as any)._load = function (req: string, ...a: unknown[]) { return req === "server-only" ? {} : orig.call(this, req, ...a); };
