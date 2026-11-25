/** Atomic INCR + EXPIRE-on-first-hit. Avoids a stuck counter if the process dies between commands. */
export const INCR_WITH_EXPIRE_SCRIPT = `
local n = redis.call("INCR", KEYS[1])
if n == 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
end
return n
`;
